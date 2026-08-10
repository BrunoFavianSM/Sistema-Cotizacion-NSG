require('dotenv').config();

// ─────────────────────────────────────────────────────────────
// Validación de entorno al arrancar
// En producción, las variables críticas de seguridad son obligatorias:
// el servidor se niega a arrancar sin ellas para evitar despliegues
// con credenciales por defecto o protecciones desactivadas en silencio.
// ─────────────────────────────────────────────────────────────
const esProduccion = process.env.NODE_ENV === 'production';

if (esProduccion) {
  const variablesCriticas = ['JWT_SECRET', 'DB_PASSWORD', 'ENCRYPTION_KEY', 'TURNSTILE_SECRET_KEY', 'FRONTEND_URL'];
  const faltantes = variablesCriticas.filter((variable) => !process.env[variable]);
  if (faltantes.length > 0) {
    console.error(`[FATAL] Faltan variables de entorno obligatorias en producción: ${faltantes.join(', ')}`);
    process.exit(1);
  }
  if (process.env.ENCRYPTION_KEY && !/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    console.error('[FATAL] ENCRYPTION_KEY debe ser de 64 caracteres hexadecimales (32 bytes)');
    process.exit(1);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
  }
}

// Advertencia de inicio: modo automático de tipo de cambio
if (!process.env.APIS_NET_TOKEN) {
  console.warn('[ADVERTENCIA] APIS_NET_TOKEN no está definido. El modo automático de tipo de cambio no estará disponible.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./configuracion/baseDatos');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ─────────────────────────────────────────────────────────────
// Rate limiting diferenciado por tipo de endpoint
//
// En desarrollo los límites se multiplican x20 para no bloquear
// el flujo de trabajo (hot-reload, navegación frecuente, etc.).
// En producción se aplican los límites reales.
//
// Criterios de diseño:
//   - Auth:        muy restrictivo → protección contra fuerza bruta
//   - Asistente:   restrictivo     → cada request llama a APIs externas (Gemini/NVIDIA)
//   - Cotizaciones: moderado       → genera PDFs/Excel, queries pesadas
//   - Productos:   permisivo       → lectura simple, bajo costo en BD
//   - General:     fallback razonable para el resto
// ─────────────────────────────────────────────────────────────
const esDev = process.env.NODE_ENV === 'development';
const devMultiplier = esDev ? 20 : 1;

const mensajeRateLimit = {
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde',
};

/** Auth: 10 req / 15 min — protección contra fuerza bruta en login/registro/recuperación */
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Asistente IA: 20 req / 15 min — cada llamada consume tokens de APIs externas */
const limitadorAsistente = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Cotizaciones: 60 req / 15 min — genera PDFs/Excel y hace queries complejas */
const limitadorCotizaciones = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Productos: 500 req / 15 min — lectura de catálogo, bajo costo */
const limitadorProductos = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** General: fallback para el resto de endpoints (/configuracion, /dashboard, etc.) */
const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

/** Reintento IA: 10 req / 15 min — operación administrativa que reactiva la cola de enriquecimiento */
const limitadorReintento = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 * devMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensajeRateLimit,
});

// Aplicar limitadores específicos antes del general (Express los evalúa en orden)
app.use('/api/auth', limitadorAuth);
app.use('/api/asistente', limitadorAsistente);
app.use('/api/cotizaciones', limitadorCotizaciones);
app.use('/api/productos', limitadorProductos);
app.use('/api/', limitadorGeneral);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/dashboard', require('./rutas/dashboard'));
app.use('/api/productos', require('./rutas/productos'));
app.use('/api/cotizaciones', require('./rutas/cotizaciones'));
app.use('/api/compatibilidad', require('./rutas/compatibilidad'));
// app.use('/api/ia', require('./rutas/ia'));           // movido a _asistente_legacy/back_3
app.use('/api/auth', require('./rutas/auth'));
app.use('/api/clientes', require('./rutas/clientes'));
app.use('/api/cuentas', require('./rutas/cuentas'));
app.use('/api/etiquetas', require('./rutas/etiquetas'));
app.use('/api/configuracion', require('./rutas/configuracion'));
app.use('/api/tipo-cambio', require('./rutas/tipoCambio'));
const rutasImportacion = require('./rutas/importacion');
rutasImportacion.setLimitadorReintento(limitadorReintento);
app.use('/api/importacion', rutasImportacion);
app.use('/api/notificaciones', require('./rutas/notificaciones'));
// app.use('/api/asistente', require('./rutas/rutasAsistente')); // movido a _asistente_legacy/back_3
app.use('/api/asistente', require('./asistente/rutasAsistente'));

// Recuperar productos pendientes de enriquecimiento (Icecat/Deltron) después
// del boot. Passenger debe aceptar el proceso antes de consultas secundarias de
// catálogo; hacerlas durante la carga del módulo puede agotar su timeout.
const servicioEnriquecimiento = require('./servicios/servicioEnriquecimiento');
const { ejecutarQuery } = require('./configuracion/baseDatos');

const reactivarColaEnriquecimiento = () => {
  servicioEnriquecimiento.reactivarDesdeDB(ejecutarQuery).catch((err) =>
    console.warn('[Enriquecimiento] Cola pendiente no recuperada:', err.message)
  );
};

// En tests no se programa trabajo en segundo plano. En producción se espera lo
// suficiente para que Passenger complete el healthcheck del proceso recién creado.
if (process.env.NODE_ENV !== 'test') {
  const demoraEnriquecimiento = esProduccion ? 10_000 : 0;
  setTimeout(reactivarColaEnriquecimiento, demoraEnriquecimiento);
}

// Servir imágenes subidas
// Ruta absoluta (independiente del cwd) + cabeceras que evitan que el
// navegador interprete un archivo subido como contenido ejecutable.
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDatos: 'conectada' });
  } catch (error) {
    res.status(500).json({ estado: 'error', baseDatos: 'desconectada' });
  }
});

// Manejo de errores centralizado
// SEGURIDAD: en producción nunca se devuelve err.message crudo al cliente
// (puede contener rutas internas, SQL o detalles de librerías). El detalle
// completo se registra solo en el log del servidor.
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const detalleSeguro = esProduccion ? undefined : err.message;

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      ...(detalleSeguro ? { detalles: detalleSeguro } : {})
    });
  }

  // Errores de autenticación
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  // Errores de base de datos
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    return res.status(409).json({
      error: 'Error de integridad de datos',
      detalles: 'La operación viola restricciones de la base de datos'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    ...(detalleSeguro ? { detalles: detalleSeguro } : {})
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
});

// Passenger carga el startup file como módulo, por lo que require.main no es
// servidor.js. En producción/desarrollo se debe escuchar explícitamente en el
// puerto asignado por cPanel; Jest queda excluido para no abrir puertos en tests.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en puerto ${PUERTO}`);
  });
}

module.exports = app;
