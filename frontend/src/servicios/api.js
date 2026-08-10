/**
 * Servicio de API
 * 
 * Cliente Axios configurado para comunicación con el backend
 * Incluye manejo de tokens JWT, errores y funciones para todos los endpoints
 * 
 * Valida Requisitos: 14.2
 */

import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 45000);
const ASISTENTE_TIMEOUT_MS = Number(import.meta.env.VITE_ASISTENTE_TIMEOUT_MS || 30000);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de solicitudes - Agregar token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas - Manejo centralizado de errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo de errores de red
    if (!error.response) {
      console.error('Error de red:', error.message);
      return Promise.reject({
        error: 'Error de conexión',
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      });
    }

    // Manejo de errores HTTP
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Token inválido o expirado: limpiar SIEMPRE todo rastro de sesión
        // y avisar a la app para resetear el estado (evita que la cuenta
        // anterior "reviva"). El guard de ruta decide la redirección.
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('sesion:expirada'));
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login';
          }
        }
        break;
      case 403:
        console.error('Acceso prohibido');
        break;
      case 404:
        console.error('Recurso no encontrado');
        break;
      case 429:
        console.error('Demasiadas solicitudes');
        break;
      case 500:
        console.error('Error interno del servidor');
        break;
      default:
        console.error(`Error ${status}:`, data);
    }

    return Promise.reject(data || error);
  }
);

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Inicia sesión de administrador
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{exito: boolean, token?: string, usuario?: Object, error?: string}>}
 */
export const login = async (correo, password, captchaToken = null) => {
  try {
    const response = await api.post('/auth/login', { correo, password, captcha_token: captchaToken });

    // Guardar token y usuario en localStorage
    if (response.data.exito && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica si el token actual es válido
 * @returns {Promise<{valido: boolean, usuario?: Object}>}
 */
export const verificarToken = async () => {
  try {
    const response = await api.post('/auth/verificar');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cierra sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/cotizador';
};

/**
 * Obtiene el usuario actual desde localStorage
 * @returns {Object|null}
 */
export const obtenerUsuarioActual = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const estaAutenticado = () => {
  return !!localStorage.getItem('token');
};

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

/**
 * Obtiene todos los productos con filtros opcionales
 * @param {Object} filtros - Filtros de búsqueda (categoria, marca, busqueda, etc.)
 * @returns {Promise<Array>}
 */
export const obtenerProductos = async (filtros = {}) => {
  try {
    const response = await api.get('/productos', { params: filtros });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene un producto por su ID
 * @param {number} id - ID del producto
 * @returns {Promise<Object>}
 */
export const obtenerProductoPorId = async (categoria, id) => {
  try {
    if (id === undefined) {
      throw new Error('Debe enviar categoria e id para obtenerProductoPorId');
    }
    const response = await api.get(`/productos/${categoria}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crea un nuevo producto (requiere autenticación)
 * @param {Object} producto - Datos del producto
 * @returns {Promise<Object>}
 */
export const crearProducto = async (producto) => {
  try {
    const response = await api.post('/productos', producto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza un producto existente (requiere autenticación)
 * @param {number} id - ID del producto
 * @param {Object} producto - Datos actualizados del producto
 * @returns {Promise<Object>}
 */
export const actualizarProducto = async (categoria, id, producto) => {
  try {
    if (producto === undefined) {
      throw new Error('Debe enviar categoria, id y producto para actualizarProducto');
    }
    const response = await api.put(`/productos/${categoria}/${id}`, producto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Elimina un producto (requiere autenticación)
 * @param {number} id - ID del producto
 * @returns {Promise<Object>}
 */
export const eliminarProducto = async (categoria, id) => {
  try {
    if (id === undefined) {
      throw new Error('Debe enviar categoria e id para eliminarProducto');
    }
    const response = await api.delete(`/productos/${categoria}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// ============================================
// FUNCIONES DE PRODUCTOS — MULTI-TABLA
// ============================================

/**
 * Obtiene productos de una categoría específica (tabla nueva)
 * @param {string} categoria - Categoría normalizada (e.g. 'procesador', 'mouse')
 * @param {Object} filtros - Filtros adicionales (socket, marca, etc.)
 * @returns {Promise<{exito:boolean, cantidad:number, productos:Array}>}
 */
export const obtenerProductosPorCategoria = async (categoria, filtros = {}) => {
  try {
    const response = await api.get('/productos', {
      params: { categoria, ...filtros }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Sube imagen de producto (requiere autenticación)
 * @param {string} categoria - Categoría del producto
 * @param {number} id - ID del producto
 * @param {File} archivo - Archivo de imagen (JPEG, PNG, WebP)
 * @returns {Promise<Object>}
 */
export const subirImagenProducto = async (categoria, id, archivo) => {
  try {
    const formData = new FormData();
    formData.append('imagen', archivo);
    const response = await api.post(`/productos/${categoria}/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene las etiquetas de perfil (Básico/Medio/Avanzado/Gamer Full).
 * @returns {Promise<{exito:boolean, etiquetas:Array<{id:number,nombre:string,orden:number}>}>}
 */
export const obtenerEtiquetas = async () => {
  try {
    const response = await api.get('/etiquetas');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Construye la URL de la ficha del producto en Deltron a partir del código de proveedor.
 * @param {string} codigoProveedor
 * @returns {string|null}
 */
export const construirUrlDeltron = (codigoProveedor) => {
  const codigo = String(codigoProveedor || '').trim();
  if (!codigo) return null;
  return `https://www.deltron.com.pe/modulos/productos/items/producto.php?item_number=${encodeURIComponent(codigo)}`;
};

/**
 * Limpia todo el catálogo de productos (requiere autenticación)
 * Elimina todos los registros de las 23 tablas de productos.
 * @returns {Promise<Object>}
 */
export const limpiarCatalogo = async () => {
  try {
    const response = await api.delete('/productos/limpiar');
    return response.data;
  } catch (error) {
    throw error;
  }
};


/**
 * Importa catálogo de productos desde archivo CSV
 * @param {File} archivo - Archivo .csv
 * @returns {Promise<{exito:boolean, insertados:number, actualizados:number, omitidos:number, errores:number, detalle_errores:Array}>}
 */
export const importarCSV = async (archivo) => {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await api.post('/importacion/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 2 minutos para archivos grandes
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene el estado actual del proceso de enriquecimiento IA.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 5.1, 5.2
 *
 * @returns {Promise<{ en_proceso: boolean, pendientes: number, completados: number, fallidos: number, ultima_actualizacion: string|null }>}
 */
export const obtenerEstadoEnriquecimiento = async () => {
  try {
    const response = await api.get('/importacion/estado-enriquecimiento');
    return response.data;
  } catch (error) {
    const mensaje = error?.mensaje || error?.response?.data?.mensaje || 'No se pudo obtener el estado de enriquecimiento.';
    throw { mensaje };
  }
};

/**
 * Obtiene un token efímero (60s) para abrir el stream SSE de enriquecimiento
 * sin exponer el JWT de sesión en la URL.
 * @returns {Promise<string|null>} Token efímero o null si falla
 */
export const obtenerTokenStream = async () => {
  try {
    const response = await api.post('/importacion/estado/stream-token');
    return response.data?.token || null;
  } catch {
    return null;
  }
};

/**
 * Mueve todos los productos con estado ia_fallido a pendiente y reactiva la cola IA.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 5.3, 5.4, 5.5
 *
 * @returns {Promise<{ exito: boolean, reintentados: number, mensaje?: string }>}
 */
export const reintentarFallidos = async () => {
  try {
    const response = await api.post('/importacion/reintentar-fallidos');
    return response.data;
  } catch (error) {
    const mensaje = error?.mensaje || error?.response?.data?.mensaje || 'No se pudo reintentar los productos fallidos.';
    throw { mensaje };
  }
};

// ============================================
// FUNCIONES DE COTIZACIONES
// ============================================

// ============================================
// BÚSQUEDA POR COMPATIBILIDAD — Req. 8.1–8.8
// ============================================

/**
 * Busca productos filtrando por compatibilidad de hardware.
 * Todos los parámetros son opcionales; los que se envíen se aplican con AND lógico.
 *
 * @param {Object} filtros
 * @param {string} [filtros.socket]     - Socket del procesador/placa madre (e.g. "LGA1700", "AM5")
 * @param {string} [filtros.ram_tipo]   - Tipo de RAM (e.g. "DDR4", "DDR5")
 * @param {string} [filtros.procesador] - Nombre o modelo del procesador (búsqueda parcial)
 * @param {string} [filtros.categoria]  - Categoría de producto a filtrar
 * @param {string} [filtros.busqueda]   - Término de búsqueda libre
 * @returns {Promise<{exito: boolean, cantidad: number, productos: Array, mensaje?: string}>}
 */
export const buscarProductosCompatibles = async (filtros = {}) => {
  try {
    const response = await api.get('/productos/buscar', { params: filtros });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron buscar productos compatibles.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Crea una nueva cotización
 * @param {Object} cotizacion - Datos de la cotización
 * @returns {Promise<Object>}
 */
export const crearCotizacion = async (cotizacion) => {
  try {
    const response = await api.post('/cotizaciones', cotizacion);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Consulta una cotización por código de ticket
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const consultarCotizacion = async (codigoTicket) => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Valida una cotización con comparación de precios
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const validarCotizacion = async (codigoTicket) => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}/validar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Marca una cotización como reclamada
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const marcarComoReclamada = async (codigoTicket) => {
  try {
    const response = await api.put(`/cotizaciones/${codigoTicket}/reclamar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Confirma (verifica) una cotización — solo admin/vendedor.
 * Transición 'Pendiente' (sin confirmar) → 'Confirmada'.
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const confirmarCotizacion = async (codigoTicket) => {
  try {
    const response = await api.put(`/cotizaciones/${codigoTicket}/confirmar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Registra que el cliente solicitó confirmar su cotización (contacto a
 * ventas por WhatsApp). Idempotente; solo aplica a cotizaciones sin confirmar.
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const solicitarConfirmacionCotizacion = async (codigoTicket) => {
  try {
    const response = await api.post(`/cotizaciones/${codigoTicket}/solicitar-confirmacion`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Consulta el historial de cotizaciones de un cliente
 * @param {string} email - Email del cliente
 * @returns {Promise<Array>}
 */
export const consultarHistorialCliente = async (email) => {
  try {
    const response = await api.get(`/cotizaciones/cliente/${email}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Busca un cliente por email o teléfono para autocompletado (requiere rol admin/vendedor)
 * @param {string} valor - Texto de búsqueda (email o teléfono, mínimo 3 caracteres)
 * @returns {Promise<{encontrado: boolean, cliente?: Object}>}
 */
export const buscarClienteAutocompletado = async (valor) => {
  const response = await api.get('/clientes/buscar', { params: { q: valor } });
  return response.data;
};

/**
 * Obtiene la lista de emails registrados para autocompletado (requiere rol admin/vendedor)
 * @returns {Promise<{emails: string[]}>}
 */
export const obtenerEmailsRegistrados = async () => {
  const response = await api.get('/clientes/emails');
  return response.data;
};

/**
 * Lista todos los clientes registrados con cotizaciones (requiere auth)
 * @returns {Promise<{exito: boolean, clientes: Array}>}
 */
export const listarClientesRegistrados = async () => {
  try {
    const response = await api.get('/cotizaciones/clientes');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Notifica por email que el equipo esta listo para recojo
 * @param {string} codigoTicket
 * @returns {Promise<Object>}
 */
export const notificarCotizacionLista = async (codigoTicket) => {
  try {
    const response = await api.post(`/cotizaciones/${codigoTicket}/notificar-listo`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Convierte un error de respuesta blob (JSON serializado) en objeto legible.
 * Con responseType 'blob', los errores del backend llegan como Blob.
 */
const normalizarErrorBlob = async (error) => {
  if (error instanceof Blob) {
    try {
      return JSON.parse(await error.text());
    } catch {
      return { mensaje: 'Error al descargar el archivo' };
    }
  }
  return error;
};

/**
 * Descarga PDF comercial de cotizacion
 * @param {string} codigoTicket
 */
export const descargarPdfCotizacion = async (codigoTicket, moneda = 'USD') => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}/pdf`, {
      params: { moneda: String(moneda || 'USD').toUpperCase() },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw await normalizarErrorBlob(error);
  }
};

/**
 * Descarga PDF tecnico de cotizacion
 * @param {string} codigoTicket
 */
export const descargarPdfTecnico = async (codigoTicket, moneda = 'USD') => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}/pdf-tecnico`, {
      params: { moneda: String(moneda || 'USD').toUpperCase() },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw await normalizarErrorBlob(error);
  }
};

/**
 * Descarga el archivo Excel (.xlsx) de una cotización.
 * Requiere autenticación (token de usuario o admin).
 * @param {string} codigoTicket - Código del ticket (NSG-YYYY-NNNN)
 * @returns {Promise<Blob>} Blob con el contenido del archivo .xlsx
 */
export const exportarExcelCotizacion = async (codigoTicket) => {
  const response = await api.get(`/cotizaciones/${codigoTicket}/excel`, {
    responseType: 'blob'
  });
  return response.data;
};

// ============================================
// FUNCIONES DE CONFIGURACION
// ============================================

/**
 * Obtiene margen de ganancia configurado
 * @returns {Promise<{exito:boolean,margen_ganancia:number}>}
 */
export const obtenerMargenGanancia = async () => {
  try {
    const response = await api.get('/configuracion/margen');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza margen de ganancia (admin)
 * @param {number} margen_ganancia
 * @param {number} tasa_igv
 * @param {number} tipo_cambio_usd_pen
 * @returns {Promise<Object>}
 */
export const actualizarMargenGanancia = async (margen_ganancia, tasa_igv, tipo_cambio_usd_pen, whatsapp_numero_ventas) => {
  try {
    const payload = { margen_ganancia_default: margen_ganancia };
    if (typeof tasa_igv === 'number') payload.tasa_igv = tasa_igv;
    if (typeof tipo_cambio_usd_pen === 'number') payload.tipo_cambio_usd_pen = tipo_cambio_usd_pen;
    if (typeof whatsapp_numero_ventas === 'string') payload.whatsapp_numero_ventas = whatsapp_numero_ventas;
    const response = await api.put('/configuracion/margen', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene la configuración completa del sistema en una sola petición.
 * Incluye margen de ganancia, tasa IGV, tipo de cambio manual y modo activo.
 * Requisitos: 9.2
 *
 * @returns {Promise<{
 *   exito: boolean,
 *   margen_ganancia: number,
 *   margen_ganancia_default: number,
 *   tasa_igv: number,
 *   tipo_cambio_usd_pen: number,
 *   modo_tipo_cambio: "manual" | "automatico",
 *   updated_at: string | null
 * }>}
 */
export const obtenerConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion/margen');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener la configuración del sistema.';
    throw { mensaje };
  }
};

/**
 * Obtiene el tipo de cambio USD/PEN automático desde el proxy backend.
 * Requiere token JWT. El token de la API externa nunca se expone al cliente.
 * Requisitos: 9.1
 *
 * @returns {Promise<{ exito: boolean, tipo_cambio: number, fuente: string, fecha: string }>}
 */
export const obtenerTipoCambioAutomatico = async () => {
  try {
    const response = await api.get('/tipo-cambio/automatico');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener el tipo de cambio automático.';
    throw { mensaje };
  }
};

/**
 * Actualiza el modo de tipo de cambio activo (manual o automático).
 * Requiere token JWT de administrador.
 * Requisitos: 9.3
 *
 * @param {"manual" | "automatico"} modo
 * @returns {Promise<{ exito: boolean, modo_tipo_cambio: string, mensaje: string }>}
 */
export const actualizarModoTipoCambio = async (modo) => {
  try {
    const response = await api.put('/configuracion/tipo-cambio', { modo });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo actualizar el modo de tipo de cambio.';
    throw { mensaje };
  }
};

// ============================================
// FUNCIONES DE COMPATIBILIDAD
// ============================================

/**
 * Valida la compatibilidad entre componentes seleccionados
 * @param {Object} componentes - Objeto con los componentes seleccionados
 * @returns {Promise<{compatible: boolean, errores: Array, advertencias: Array}>}
 */
export const validarCompatibilidad = async (componentes) => {
  try {
    const response = await api.post('/compatibilidad/validar', { componentes });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// FUNCIONES DE INTELIGENCIA ARTIFICIAL
// ============================================

/**
 * Inicia una nueva conversación con el asistente IA
 * @param {string} mensajeInicial - Mensaje inicial del cliente
 * @returns {Promise<{sesionId: string, pregunta: string, contexto: Object}>}
 */
export const iniciarConversacionIA = async (mensajeInicial) => {
  try {
    const response = await api.post('/ia/iniciar', { mensajeInicial });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Continúa una conversación existente con el asistente IA
 * @param {string} sesionId - ID de la sesión
 * @param {string} respuestaCliente - Respuesta del cliente
 * @returns {Promise<{completado: boolean, pregunta?: string, recomendacion?: Object}>}
 */
export const continuarConversacionIA = async (sesionId, respuestaCliente) => {
  try {
    const response = await api.post('/ia/continuar', { sesionId, respuestaCliente });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene estadísticas de uso de IA
 * @returns {Promise<Object>}
 */
export const obtenerEstadisticasIA = async () => {
  try {
    const response = await api.get('/ia/estadisticas');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// FUNCIONES DE REGISTRO Y RECUPERACION
// ============================================

/**
 * Registra un nuevo usuario
 * @param {Object} datos - { username, password, confirmarPassword, correo, nombre_completo, telefono? }
 * @returns {Promise<{exito: boolean, token?: string, usuario?: Object, error?: string}>}
 */
export const registrar = async ({ password, confirmarPassword, correo, nombre, apellidos, telefono, dni, captcha_token }) => {
  try {
    const response = await api.post('/auth/registro', {
      password, confirmarPassword, correo, nombre, apellidos, telefono, dni, captcha_token
    });

    if (response.data.exito && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Consulta nombre/apellidos por DNI (decolecta) para autocompletar el registro.
 * @param {string} dni - 8 dígitos
 * @returns {Promise<{exito:boolean, datos?:{nombre,apellidos,nombre_completo}, error?:string}>}
 */
export const consultarDni = async (dni) => {
  const response = await api.get(`/auth/consultar-dni/${encodeURIComponent(dni)}`);
  return response.data;
};

/**
 * Activa una cuenta pendiente definiendo su contraseña (login por correo).
 * @param {Object} datos - { correo, password, confirmarPassword }
 */
export const activarCuenta = async ({ correo, password, confirmarPassword }) => {
  const response = await api.post('/auth/activar', { correo, password, confirmarPassword });
  if (response.data?.exito && response.data?.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
  }
  return response.data;
};

// ============================================
// GESTIÓN DE CUENTAS (admin)
// ============================================
export const obtenerCuentas = async () => (await api.get('/cuentas')).data;
export const crearCuenta = async (datos) => (await api.post('/cuentas', datos)).data;
export const actualizarCuenta = async (id, datos) => (await api.put(`/cuentas/${id}`, datos)).data;
export const eliminarCuenta = async (id) => (await api.delete(`/cuentas/${id}`)).data;

/**
 * Solicita recuperacion de contrasena por correo electronico
 * @param {string} correo
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const solicitarRecuperacion = async (correo) => {
  try {
    const response = await api.post('/auth/recuperar', { correo });
    return response.data;
  } catch (error) {
    // Retornar el body del error (404 = cuenta no encontrada) en lugar de lanzar
    if (error?.response?.data) return error.response.data;
    throw error;
  }
};

/**
 * Solicita recuperacion de contrasena por numero de telefono
 * Requisitos: 1.6, 1.7, 1.8
 * @param {string} telefono - Numero de telefono (solo digitos, 7-15 caracteres)
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const solicitarRecuperacionPorTelefono = async (telefono) => {
  try {
    const response = await api.post('/auth/recuperar-por-telefono', { telefono });
    return response.data;
  } catch (error) {
    // Retornar el body del error (404 = cuenta no encontrada) en lugar de lanzar
    if (error?.response?.data) return error.response.data;
    throw error;
  }
};

/**
 * Restablece contrasena con token de recuperacion
 * @param {Object} datos - { token, nuevaPassword, confirmarPassword }
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const restablecerContrasena = async ({ token, nuevaPassword, confirmarPassword }) => {
  try {
    const response = await api.post('/auth/restablecer', {
      token, nuevaPassword, confirmarPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// GESTIÓN DE CUENTA PROPIA (self-service)
// ============================================

/**
 * Obtiene el perfil propio (correo/teléfono desencriptados) del usuario autenticado.
 * @returns {Promise<{exito: boolean, perfil: Object}>}
 */
export const obtenerPerfilPropio = async () => {
  const response = await api.get('/auth/perfil');
  return response.data;
};

/**
 * Actualiza los datos editables de la propia cuenta (teléfono y correo).
 * @param {Object} datos - { telefono, correo }
 * @returns {Promise<{exito: boolean, mensaje: string, perfil?: Object}>}
 */
export const actualizarPerfilPropio = async ({ telefono, correo }) => {
  const response = await api.put('/auth/perfil', { telefono, correo });
  return response.data;
};

/**
 * Cambia la contraseña de la propia cuenta (exige la actual).
 * @param {Object} datos - { contrasena_actual, nueva_password, confirmar_password }
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const cambiarContrasenaPropia = async ({ contrasena_actual, nueva_password, confirmar_password }) => {
  const response = await api.post('/auth/cambiar-contrasena', {
    contrasena_actual, nueva_password, confirmar_password
  });
  return response.data;
};

/**
 * Da de baja (baja lógica) la propia cuenta. Exige la contraseña.
 * @param {Object} datos - { password }
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const desactivarCuentaPropia = async ({ password }) => {
  const response = await api.post('/auth/desactivar-cuenta', { password });
  return response.data;
};

// ============================================
// FUNCIONES DE DASHBOARD
// ============================================

/**
 * Obtiene las métricas operativas del dashboard de administración.
 * Requiere token JWT de administrador.
 * Valida Requisito: 1.7
 *
 * @returns {Promise<{
 *   exito: boolean,
 *   hoy: { total: number, ingresos: number },
 *   semana: { total: number, ingresos: number },
 *   productosTop: Array<{ nombre_producto: string, categoria: string, apariciones: number }>
 * }>}
 */
export const obtenerMetricasDashboard = async () => {
  try {
    const response = await api.get('/dashboard/metricas');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron obtener las métricas del dashboard.';
    throw { mensaje };
  }
};

// ============================================
// FUNCIONES DE HISTORIAL DE PRECIOS
// ============================================

/**
 * Obtiene el historial de cambios de precio de un producto.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 3.4, 3.5, 3.6
 *
 * @param {number} idProducto - ID del producto
 * @returns {Promise<{ exito: boolean, id_producto: number, total: number, historial: Array }>}
 */
export const obtenerHistorialPrecios = async (idProducto) => {
  try {
    const response = await api.get(`/productos/${idProducto}/historial-precios`);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener el historial de precios.';
    throw { mensaje };
  }
};

// ============================================
// FUNCIONES DE NOTIFICACIONES
// ============================================

/**
 * Obtiene las notificaciones pendientes (no leídas) del usuario autenticado.
 * Requiere token JWT de usuario.
 * Valida Requisitos: 5.2
 *
 * @returns {Promise<{ exito: boolean, notificaciones: Array }>}
 */
export const obtenerNotificacionesPendientes = async () => {
  try {
    const response = await api.get('/notificaciones/pendientes');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron obtener las notificaciones.';
    throw { mensaje };
  }
};

/**
 * Marca una notificación como leída.
 * Requiere token JWT de usuario.
 * Valida Requisitos: 5.5
 *
 * @param {number} idNotificacion - ID de la notificación a marcar como leída
 * @returns {Promise<{ exito: boolean }>}
 */
export const marcarNotificacionLeida = async (idNotificacion) => {
  try {
    const response = await api.patch(`/notificaciones/${idNotificacion}/leer`);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo marcar la notificación como leída.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Obtiene todas las notificaciones (leídas y no leídas) del usuario autenticado,
 * ordenadas por fecha_creacion descendente, con paginación opcional.
 * Requiere token JWT de usuario.
 * Valida Requisitos: 6.1, 6.10
 *
 * @param {{ limit?: number, offset?: number }} opciones - Parámetros de paginación
 * @returns {Promise<{ exito: boolean, total: number, notificaciones: Array }>}
 */
export const obtenerTodasNotificaciones = async ({ limit = 50, offset = 0 } = {}) => {
  try {
    const response = await api.get('/notificaciones/todas', { params: { limit, offset } });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron obtener las notificaciones.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Marca todas las notificaciones no leídas del usuario autenticado como leídas.
 * Requiere token JWT de usuario.
 * Valida Requisitos: 6.11
 *
 * @returns {Promise<{ exito: boolean, actualizadas: number }>}
 */
export const marcarTodasNotificacionesLeidas = async () => {
  try {
    const response = await api.patch('/notificaciones/leer-todas');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron marcar las notificaciones como leídas.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Obtiene las cotizaciones propias del usuario autenticado.
 * Llama a GET /api/cotizaciones/propias con el token de autenticación.
 * El token se adjunta automáticamente por el interceptor de Axios.
 * Retorna la misma estructura que consultarHistorialCliente para compatibilidad.
 * Requiere token JWT de usuario.
 * Valida Requisitos: 5.2
 *
 * @returns {Promise<{ exito: boolean, cliente: { nombre: string, email: string }, cotizaciones: Array }>}
 */
export const obtenerCotizacionesPropias = async () => {
  try {
    const response = await api.get('/cotizaciones/propias');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron obtener las cotizaciones propias.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

// ============================================
// CONFIGURACIONES COMPARTIDAS (Req. 10)
// ============================================

/**
 * Serializa una configuración de componentes a una URL compartible.
 *
 * La configuración es un objeto con claves de categoría y valores de ID de
 * producto (o array de IDs para RAM). Ejemplo:
 *   { procesador: { id: 5, categoria: 'procesador' }, ram: [{ id: 2, categoria: 'ram' }] }
 *
 * La función es determinista: la misma entrada siempre produce la misma URL.
 *
 * @param {Object} configuracion - Objeto de configuración con IDs de productos por categoría
 * @returns {string} URL relativa con el parámetro config en base64
 * @validates Requisitos 10.2, 10.8
 */
export const generarUrlConfiguracion = (configuracion) => {
  // Serializar solo los datos necesarios (id + categoria) para mantener URLs cortas
  const payload = {};

  Object.entries(configuracion).forEach(([categoria, valor]) => {
    if (!valor) return;

    if (Array.isArray(valor)) {
      // RAM: array de productos
      const ids = valor
        .filter(Boolean)
        .map((p) => ({ id: p.id, categoria: p.categoria || categoria }));
      if (ids.length > 0) payload[categoria] = ids;
    } else if (valor && typeof valor === 'object' && valor.id != null) {
      payload[categoria] = { id: valor.id, categoria: valor.categoria || categoria };
    }
  });

  // Ordenar claves para garantizar determinismo
  const payloadOrdenado = Object.fromEntries(
    Object.keys(payload)
      .sort()
      .map((k) => [k, payload[k]])
  );

  const json = JSON.stringify(payloadOrdenado);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `/configuracion?config=${base64}`;
};

/**
 * Decodifica un string base64 de configuración compartida.
 *
 * @param {string} base64 - String base64 generado por generarUrlConfiguracion
 * @returns {Object} Objeto de configuración con IDs de productos por categoría
 * @throws {Error} Si el string es inválido o no puede parsearse
 * @validates Requisitos 10.2, 10.5, 10.8
 */
export const decodificarConfiguracion = (base64) => {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('El parámetro de configuración está vacío o es inválido.');
  }

  let json;
  try {
    json = decodeURIComponent(escape(atob(base64)));
  } catch {
    throw new Error('El enlace de configuración no es válido. No se pudo decodificar.');
  }

  let configuracion;
  try {
    configuracion = JSON.parse(json);
  } catch {
    throw new Error('El enlace de configuración contiene datos corruptos.');
  }

  if (typeof configuracion !== 'object' || configuracion === null || Array.isArray(configuracion)) {
    throw new Error('El formato de la configuración compartida no es válido.');
  }

  return configuracion;
};

// ============================================
// FUNCIONES DE CONFIGURACIÓN DE IA
// ============================================

/**
 * Obtiene la configuración de modo y modelos del asistente de IA.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 2.10, 2.11
 *
 * @returns {Promise<{
 *   modo_activo: 'pipeline' | 'nvidia' | 'gemini',
 *   gemini_model: string,
 *   nvidia_model: string,
 *   nvidia_classifier_model: string,
 *   nvidia_embedding_model: string,
 *   nvidia_reranker_model: string
 * }>}
 */
export const obtenerModelosIA = async () => {
  try {
    const response = await api.get('/configuracion/modelos-ia');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener la configuración de modelos de IA.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Actualiza la configuración de modo y modelos del asistente de IA.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 2.12, 2.13, 2.14, 2.15
 *
 * @param {{
 *   modo_activo: 'pipeline' | 'nvidia' | 'gemini',
 *   gemini_model?: string,
 *   nvidia_model?: string,
 *   nvidia_classifier_model?: string,
 *   nvidia_embedding_model?: string,
 *   nvidia_reranker_model?: string
 * }} config
 * @returns {Promise<{ exito: boolean, config: Object }>}
 */
export const actualizarModelosIA = async (config) => {
  try {
    const response = await api.put('/configuracion/modelos-ia', config);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo actualizar la configuración de modelos de IA.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

// ============================================
// FUNCIONES DE CLAVES API DE IA (Req. 11)
// ============================================

/**
 * Obtiene el estado de configuración de las claves API de IA.
 * Retorna solo si están configuradas, sin revelar los valores.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 11.1, 11.8
 *
 * @returns {Promise<{ exito: boolean, gemini_configurada: boolean, nvidia_configurada: boolean }>}
 */
export const obtenerApiKeysIA = async () => {
  try {
    const response = await api.get('/configuracion/api-keys-ia');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener el estado de las claves API de IA.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Actualiza las claves API de IA (encriptadas en BD).
 * Solo envía los campos que el admin haya llenado.
 * Requiere token JWT de administrador.
 * Valida Requisitos: 11.2, 11.3, 11.9
 *
 * @param {{ gemini_api_key?: string, nvidia_api_key?: string }} claves
 * @returns {Promise<{ exito: boolean }>}
 */
export const actualizarApiKeysIA = async (claves) => {
  try {
    const response = await api.put('/configuracion/api-keys-ia', claves);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudieron guardar las claves API de IA.';
    throw { mensaje, codigo: error?.codigo || error?.response?.data?.codigo };
  }
};

/**
 * Estado del token de consulta de DNI (decolecta). No expone el valor.
 * @returns {Promise<{exito:boolean, configurado:boolean}>}
 */
export const obtenerEstadoTokenDni = async () => {
  const response = await api.get('/configuracion/token-dni');
  return response.data;
};

/**
 * Guarda (encriptado) el token de decolecta. Solo admin.
 * @param {string} token
 */
export const actualizarTokenDni = async (token) => {
  const response = await api.put('/configuracion/token-dni', { token });
  return response.data;
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica el estado de salud del servidor
 * @returns {Promise<{estado: string, baseDatos: string}>}
 */
export const verificarSalud = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Exportar instancia de axios configurada para casos especiales
export { ASISTENTE_TIMEOUT_MS };
export default api;

