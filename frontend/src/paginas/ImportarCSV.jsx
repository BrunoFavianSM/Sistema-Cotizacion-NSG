/**
 * Página de Importación de CSV
 * 
 * Permite a administradores importar catálogos de productos desde archivos CSV.
 * Features: drag & drop, previsualización, spinner, resumen de resultados,
 *           sección de estado de enriquecimiento IA con auto-refresh.
 * 
 * Ruta: /admin/importar-csv (protegida)
 * Requisitos: 6.1–6.7, 7.1–7.9
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const LIMITE_FILAS_PREVIEW = 10;
const CLAVE_ULTIMA_IMPORTACION = 'nsg_ultima_importacion';

function parsearLineaCSV(linea) {
  const campos = [];
  let actual = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (dentroComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if (c === ',' && !dentroComillas) {
      campos.push(actual.trim());
      actual = '';
    } else {
      actual += c;
    }
  }

  campos.push(actual.trim());
  return campos;
}

function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  if (lineas.length < 2) return [];
  return lineas.slice(1).map(parsearLineaCSV);
}

// Detectar preferencia de movimiento reducido una sola vez al cargar el módulo
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Formateador de fecha/hora en español peruano (Req 7.6)
const fmt = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

export default function ImportarCSV() {
  const { autenticado, cargandoAuth, esAdmin } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState({ columnas: [], filas: [] });
  const [importando, setImportando] = useState(false);
  // Resultado de la última importación — persiste entre cambios de vista (localStorage)
  const [resultado, setResultado] = useState(() => {
    try { const s = localStorage.getItem(CLAVE_ULTIMA_IMPORTACION); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);

  // ── Estado de la carga de datos del catálogo ─────────────────────────────
  const [estadoIA, setEstadoIA] = useState(null);
  const [reintentando, setReintentando] = useState(false);

  // ── Estado de la carga de datos: consulta al montar (para que persista al
  //    volver a esta vista) + polling mientras haya carga en proceso. ────────
  useEffect(() => {
    let activo = true;
    let intervalo = null;
    const consultar = async () => {
      try {
        const data = await api.obtenerEstadoEnriquecimiento();
        if (!activo) return;
        setEstadoIA(data);
        if (intervalo && !data?.en_proceso) { clearInterval(intervalo); intervalo = null; }
      } catch { /* silencioso — no interrumpir la UI por un fallo de polling */ }
    };
    consultar(); // siempre al montar (restaura el panel aunque no haya import fresco)
    intervalo = setInterval(consultar, 10_000);
    return () => { activo = false; if (intervalo) clearInterval(intervalo); };
  }, []);

  // Protección de autenticación y rol (defensa en profundidad:
  // la ruta ya exige admin, pero el componente lo vuelve a verificar)
  if (!cargandoAuth && (!autenticado || !esAdmin)) {
    return <Navigate to="/login" replace />;
  }

  const procesarArchivo = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Solo se permiten archivos .csv');
      return;
    }
    setArchivo(file);
    setError('');
    setResultado(null);

    // Leer encabezado + primeras filas completas para previsualización desplazable.
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target.result;
      const lineas = texto.split(/\r?\n/).filter(l => l.trim());
      if (lineas.length < 2) {
        setPreview({ columnas: [], filas: [] });
        return;
      }

      const columnas = parsearLineaCSV(lineas[0]);
      const filas = parsearCSV(texto).slice(0, LIMITE_FILAS_PREVIEW).map((campos) =>
        columnas.map((_, idx) => campos[idx] || '—')
      );

      setPreview({ columnas, filas });
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setArrastrando(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer?.files?.[0];
    procesarArchivo(file);
  }, [procesarArchivo]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    procesarArchivo(file);
  }, [procesarArchivo]);

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    setError('');
    setResultado(null);

    try {
      const respuesta = await api.importarCSV(archivo);
      setResultado(respuesta);
      try { localStorage.setItem(CLAVE_ULTIMA_IMPORTACION, JSON.stringify(respuesta)); } catch { /* no-op */ }
    } catch (err) {
      const mensajeError = err?.mensaje || err?.error || 'Error de red al importar. Intenta nuevamente.';
      setError(mensajeError);
    } finally {
      setImportando(false);
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setPreview({ columnas: [], filas: [] });
    setResultado(null);
    setEstadoIA(null);
    setError('');
    try { localStorage.removeItem(CLAVE_ULTIMA_IMPORTACION); } catch { /* no-op */ }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Reintentar productos fallidos (Req 7.4, 7.5) ─────────────────────────
  const handleReintentar = async () => {
    setReintentando(true);
    try {
      const respuesta = await api.reintentarFallidos();
      const msg = respuesta?.reintentados > 0
        ? `${respuesta.reintentados} productos encolados para reintento.`
        : respuesta?.mensaje || 'No hay productos fallidos para reintentar.';
      toast.success('Reintento iniciado', msg);
      // Forzar refresh inmediato del estado IA
      try {
        const data = await api.obtenerEstadoEnriquecimiento();
        setEstadoIA(data);
      } catch { /* silencioso */ }
    } catch (err) {
      toast.error('Error al reintentar', err?.mensaje || 'No se pudo encolar los productos fallidos.');
    } finally {
      setReintentando(false);
    }
  };

  if (cargandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Verificando autenticación..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Importar catálogo CSV</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sube un archivo CSV para actualizar el catálogo de productos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/productos')}
          className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal hover:bg-[var(--color-surface-hover)]"
        >
          ← Panel de admin
        </button>
      </header>

      {/* Zona Drag & Drop */}
      <section
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar archivo CSV"
        data-tour="csv-zona"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        className={`surface-card cursor-pointer border-2 border-dashed p-10 text-center transition-all duration-higNormal ${
          arrastrando
            ? 'border-[var(--color-accent)] bg-[color:rgba(0,122,255,0.06)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="sr-only"
          id="importar-csv-input"
          aria-hidden="true"
        />

        <svg className="mx-auto h-12 w-12 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>

        {archivo ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">{archivo.name}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{(archivo.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-medium text-[var(--color-text)]">Arrastra un archivo CSV aquí</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">o haz clic para seleccionar</p>
          </div>
        )}
      </section>

      {/* Previsualización */}
      {preview.filas.length > 0 && (
        <section className="surface-card overflow-hidden" data-tour="csv-preview">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Previsualización ({preview.filas.length} filas)
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Desplázate horizontal y verticalmente para revisar todas las columnas sin cambiar el tamaño del panel.
            </p>
          </div>
          <div className="max-h-[22rem] overflow-auto">
            <table className="min-w-max text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                <tr className="border-b border-[var(--color-border)]">
                  {preview.columnas.map((col, idx) => (
                    <th key={`${col || 'columna'}-${idx}`} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {col || `Columna ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.filas.map((fila, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                    {fila.map((celda, j) => (
                      <td key={j} className="max-w-[18rem] whitespace-nowrap px-3 py-2 text-sm text-[var(--color-text)]">
                        {celda}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Botón de importación */}
      {archivo && !resultado && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={importar}
            disabled={importando}
            className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {importando ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Importando...
              </span>
            ) : (
              'Importar'
            )}
          </button>
          <button
            type="button"
            onClick={reiniciar}
            disabled={importando}
            className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="surface-card border-l-4 border-[var(--color-danger)] p-4">
          <p className="text-sm font-semibold text-[var(--color-danger)]">Error</p>
          <p className="mt-1 text-sm text-[var(--color-text)]">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <section className="surface-card space-y-4 p-5" data-tour="csv-resultado">
          <h2 className="text-base font-bold text-[var(--color-text)]">Resultado de la importación</h2>

          {/* Grid de resultados — 5 tarjetas (Req 7.1) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(48,209,88,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-success)]">{resultado.insertados ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Insertados</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(0,122,255,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-accent)]">{resultado.actualizados ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Actualizados</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,214,10,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-warning)]">{resultado.omitidos ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Omitidos</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,69,58,0.1)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--color-danger)]">{resultado.errores ?? 0}</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Errores</p>
            </div>
            {/* Tarjeta Pendientes IA */}
            <div className="rounded-[var(--radius-sm)] bg-[color:rgba(175,82,222,0.1)] p-3 text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--color-warning, #af52de)' }}>
                {resultado.pendientes_enriquecimiento ?? 0}
              </p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Pendientes</p>
            </div>
          </div>

          {/* Detalle de errores */}
          {resultado.detalle_errores?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--color-danger)]">Detalle de errores</h3>
              <div className="max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 space-y-1">
                {resultado.detalle_errores.map((err, i) => (
                  <p key={i} className="text-xs text-[var(--color-text-muted)]">
                    <span className="font-semibold text-[var(--color-danger)]">Fila {err.fila ?? i + 1}:</span>{' '}
                    {err.error || err.mensaje || JSON.stringify(err)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Sección Estado del enriquecimiento IA (Req 7.2–7.9) ─────────── */}
          <div className="surface-card rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Estado de la carga de datos</h3>

            {/* Skeleton en primera carga */}
            {estadoIA === null ? (
              <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Cargando estado de enriquecimiento">
                <div className="h-4 w-48 rounded bg-[var(--color-border)]" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-14 rounded bg-[var(--color-border)]" />
                  <div className="h-14 rounded bg-[var(--color-border)]" />
                  <div className="h-14 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            ) : (
              <>
                {/* Indicador de progreso animado (Req 7.3, 7.9) */}
                {estadoIA.en_proceso && (
                  <div className="flex items-center gap-2" role="status" aria-live="polite">
                    <span
                      className={`inline-block h-2 w-2 rounded-full bg-[var(--color-warning)]${!prefersReducedMotion ? ' animate-pulse' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-[var(--color-text-muted)]">Cargando datos del catálogo...</span>
                  </div>
                )}

                {/* Contadores (Req 7.2) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,214,10,0.1)] p-3 text-center">
                    <p className="text-xl font-bold text-[var(--color-warning)]">{estadoIA.pendientes ?? 0}</p>
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">Pendientes</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[color:rgba(0,122,255,0.1)] p-3 text-center">
                    <p className="text-xl font-bold text-[var(--color-accent)]">{estadoIA.completados ?? 0}</p>
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">Completados</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,69,58,0.1)] p-3 text-center">
                    <p className="text-xl font-bold text-[var(--color-danger)]">{estadoIA.fallidos ?? 0}</p>
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">Fallidos</p>
                  </div>
                </div>

                {/* Última actualización (Req 7.6) */}
                {estadoIA.ultima_actualizacion && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Última actualización:{' '}
                    <time dateTime={estadoIA.ultima_actualizacion}>
                      {fmt.format(new Date(estadoIA.ultima_actualizacion))}
                    </time>
                  </p>
                )}

                {/* Botón Reintentar productos fallidos (Req 7.4, 7.5) */}
                {!estadoIA.en_proceso && (estadoIA.fallidos ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleReintentar}
                    disabled={reintentando}
                    className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-danger)] px-4 text-sm font-medium text-[var(--color-danger)] transition-opacity hover:bg-[color:rgba(255,69,58,0.08)] disabled:opacity-50"
                  >
                    {reintentando ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                        Reintentando...
                      </span>
                    ) : (
                      'Reintentar productos fallidos'
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reiniciar}
              className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white"
            >
              Importar otro archivo
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/productos')}
              className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)]"
            >
              Ver productos
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
