import { useCallback, useEffect, useRef, useState } from 'react';
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerTodasNotificaciones,
} from '../../servicios/api';

/**
 * Formatea una fecha ISO en formato legible en español (Perú).
 * @param {string|Date} fecha
 * @returns {string}
 */
function formatearFecha(fecha) {
  try {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Ícono SVG de campana (bell) — inline, sin dependencias externas.
 */
function IconoCampana({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

/**
 * Ícono SVG de check — inline.
 */
function IconoCheck({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/**
 * Ícono SVG de advertencia/error — inline.
 */
function IconoError({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

// ─── Estado de carga ────────────────────────────────────────────────────────

function EstadoCarga() {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-6"
      aria-busy="true"
      aria-label="Cargando notificaciones"
      role="status"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse flex-col gap-2">
          <div className="h-3.5 w-3/4 rounded-full bg-[var(--color-surface-soft)]" />
          <div className="h-3 w-full rounded-full bg-[var(--color-surface-soft)]" />
          <div className="h-3 w-1/2 rounded-full bg-[var(--color-surface-soft)]" />
        </div>
      ))}
    </div>
  );
}

// ─── Estado de error ─────────────────────────────────────────────────────────

function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" role="alert">
      <IconoError className="h-8 w-8 text-[var(--color-danger)]" />
      <p className="text-sm text-[var(--color-text-muted)]">
        {mensaje || 'No se pudieron cargar las notificaciones.'}
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="min-h-[44px] rounded-[10px] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-150 ease-out hover:bg-[var(--color-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        Reintentar
      </button>
    </div>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <IconoCampana className="h-8 w-8 text-[var(--color-text-muted)]" />
      <p className="text-sm font-medium text-[var(--color-text)]">Sin notificaciones</p>
      <p className="text-xs text-[var(--color-text-muted)]">
        Aquí aparecerán los eventos relevantes de tu cuenta.
      </p>
    </div>
  );
}

// ─── Ítem de notificación ─────────────────────────────────────────────────────

function ItemNotificacion({ notificacion, onMarcarLeida, indice, itemRefs }) {
  const { id, titulo, mensaje, fecha_creacion, leida } = notificacion;

  const handleClick = () => {
    if (!leida) {
      onMarcarLeida(id);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !leida) {
      e.preventDefault();
      onMarcarLeida(id);
    }
  };

  return (
    <div
      ref={(el) => {
        if (itemRefs) itemRefs.current[indice] = el;
      }}
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${leida ? 'Leída' : 'No leída'}. ${titulo}. ${mensaje}. ${formatearFecha(fecha_creacion)}`}
      className={[
        'group flex min-h-[44px] cursor-pointer flex-col gap-1 px-4 py-3 transition-colors duration-150 ease-out',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]',
        leida
          ? 'bg-transparent hover:bg-[var(--color-surface-soft)]'
          : 'bg-[color:rgba(10,132,255,0.08)] hover:bg-[color:rgba(10,132,255,0.13)] dark:bg-[color:rgba(10,132,255,0.10)] dark:hover:bg-[color:rgba(10,132,255,0.16)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            'text-sm font-medium leading-snug',
            leida ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]',
          ].join(' ')}
        >
          {titulo}
        </span>
        {!leida && (
          <span
            className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]"
            aria-hidden="true"
          />
        )}
      </div>

      <p
        className={[
          'text-xs leading-relaxed',
          leida ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-secondary,var(--color-text-muted))]',
        ].join(' ')}
      >
        {mensaje}
      </p>

      <time
        dateTime={fecha_creacion}
        className="text-[11px] text-[var(--color-text-muted)]"
      >
        {formatearFecha(fecha_creacion)}
      </time>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * PanelNotificaciones — Panel desplegable con historial de notificaciones del usuario.
 *
 * Props:
 *   abierto {boolean}           — controla visibilidad
 *   onCerrar {Function}         — callback al cerrar
 *   onActualizarConteo {Function} — callback para actualizar el conteo del badge en AppShell
 *
 * Requisitos: 6.8, 6.9, 6.10, 6.12, 6.13, 6.14, 6.15, 6.16
 */
export default function PanelNotificaciones({ abierto, onCerrar, onActualizarConteo }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const panelRef = useRef(null);
  const itemRefs = useRef([]);

  // ── Reducir movimiento si el usuario lo prefiere ──────────────────────────
  const prefiereMenosMovimiento =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Cargar notificaciones al abrir ────────────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerTodasNotificaciones();
      setNotificaciones(data.notificaciones ?? []);
    } catch (err) {
      setError(err?.mensaje || 'No se pudieron cargar las notificaciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) {
      cargarNotificaciones();
    }
  }, [abierto, cargarNotificaciones]);

  // ── Cerrar con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!abierto) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  // ── Navegación con flechas entre ítems ───────────────────────────────────
  const handleListaKeyDown = useCallback(
    (e) => {
      const items = itemRefs.current.filter(Boolean);
      if (items.length === 0) return;

      const focusedIndex = items.findIndex((el) => el === document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
        items[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
        items[prev]?.focus();
      }
    },
    []
  );

  // ── Marcar una notificación como leída ────────────────────────────────────
  const handleMarcarLeida = useCallback(
    async (id) => {
      try {
        await marcarNotificacionLeida(id);
        setNotificaciones((prev) => {
          const actualizadas = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
          const noLeidas = actualizadas.filter((n) => !n.leida).length;
          onActualizarConteo?.(noLeidas);
          return actualizadas;
        });
      } catch {
        // Error silencioso — la UI no se rompe; el ítem permanece como no leído
      }
    },
    [onActualizarConteo]
  );

  // ── Marcar todas como leídas ──────────────────────────────────────────────
  const handleMarcarTodas = useCallback(async () => {
    setMarcandoTodas(true);
    try {
      await marcarTodasNotificacionesLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      onActualizarConteo?.(0);
    } catch {
      // Error silencioso — el botón vuelve a su estado normal
    } finally {
      setMarcandoTodas(false);
    }
  }, [onActualizarConteo]);

  // ── Conteo de no leídas (derivado) ───────────────────────────────────────
  const conteoNoLeidas = notificaciones.filter((n) => !n.leida).length;

  // ── No renderizar si está cerrado ─────────────────────────────────────────
  if (!abierto) return null;

  // ── Clases de animación (respeta prefers-reduced-motion) ─────────────────
  const animacionPanel = prefiereMenosMovimiento
    ? ''
    : 'animate-fadeInDown';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Panel de notificaciones"
      aria-modal="false"
      className={[
        'absolute right-0 top-full z-50 mt-2 w-80 sm:w-96',
        'rounded-[14px] border border-[var(--color-border)]',
        'bg-[var(--color-surface)] shadow-[0_8px_32px_rgba(0,0,0,.18)]',
        'flex flex-col overflow-hidden',
        animacionPanel,
      ].join(' ')}
      style={{ maxHeight: '480px' }}
    >
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <IconoCampana className="h-4 w-4 text-[var(--color-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Notificaciones</h2>
          {conteoNoLeidas > 0 && (
            <span
              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[11px] font-semibold text-white"
              aria-label={`${conteoNoLeidas} sin leer`}
            >
              {conteoNoLeidas > 99 ? '99+' : conteoNoLeidas}
            </span>
          )}
        </div>

        {conteoNoLeidas > 0 && !cargando && !error && (
          <button
            type="button"
            onClick={handleMarcarTodas}
            disabled={marcandoTodas}
            aria-label="Marcar todas las notificaciones como leídas"
            className={[
              'flex min-h-[32px] items-center gap-1.5 rounded-[8px] px-2.5 text-xs font-medium',
              'text-[var(--color-accent)] transition-colors duration-150 ease-out',
              'hover:bg-[color:rgba(10,132,255,0.10)] focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            <IconoCheck className="h-3.5 w-3.5" />
            {marcandoTodas ? 'Marcando…' : 'Marcar todas'}
          </button>
        )}
      </div>

      {/* ── Cuerpo ────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto" onKeyDown={handleListaKeyDown}>
        {cargando && <EstadoCarga />}

        {!cargando && error && (
          <EstadoError mensaje={error} onReintentar={cargarNotificaciones} />
        )}

        {!cargando && !error && notificaciones.length === 0 && <EstadoVacio />}

        {!cargando && !error && notificaciones.length > 0 && (
          <div role="list" aria-label="Lista de notificaciones">
            {notificaciones.map((notif, idx) => (
              <div key={notif.id}>
                <ItemNotificacion
                  notificacion={notif}
                  onMarcarLeida={handleMarcarLeida}
                  indice={idx}
                  itemRefs={itemRefs}
                />
                {/* Separador entre ítems (excepto el último) */}
                {idx < notificaciones.length - 1 && (
                  <div
                    className="mx-4 border-t border-[var(--color-border)]"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
