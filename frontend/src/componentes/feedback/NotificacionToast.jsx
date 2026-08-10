/**
 * NotificacionToast
 *
 * Muestra una notificación del sistema con título, mensaje, animación de
 * entrada/salida y auto-cierre a los 5 segundos.
 *
 * Valida Requisitos: 5.8, 5.9, 5.10, 5.11
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * @param {{
 *   notificacion: { id: number, titulo: string, mensaje: string },
 *   onCerrar: (id: number) => void
 * }} props
 */
export function NotificacionToast({ notificacion, onCerrar }) {
  const timerRef = useRef(null);

  // Auto-cierre a los 5 segundos si el usuario no interactúa (Req. 5.11)
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onCerrar(notificacion.id);
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, [notificacion.id, onCerrar]);

  const handleCerrar = () => {
    clearTimeout(timerRef.current);
    onCerrar(notificacion.id);
  };

  return (
    <motion.div
      layout
      // Animación de entrada y salida (Req. 5.9)
      // motion respeta prefers-reduced-motion automáticamente cuando se usa
      // la variante de reducción de movimiento del sistema operativo.
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto w-full max-w-sm rounded-[var(--radius-md)] border border-[color:rgba(10,132,255,0.35)] bg-[var(--color-surface)] px-3 py-3 shadow-hig2"
    >
      <div className="flex items-start gap-3">
        {/* Ícono de notificación */}
        <span
          className="mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]"
          aria-hidden="true"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </span>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{notificacion.titulo}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{notificacion.mensaje}</p>
        </div>

        {/* Botón de cierre (Req. 5.10) */}
        <button
          type="button"
          onClick={handleCerrar}
          aria-label="Cerrar notificación"
          className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
        >
          <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Contenedor de toasts de notificación del sistema.
 * Renderiza un NotificacionToast por cada notificación en la lista.
 *
 * @param {{
 *   notificaciones: Array<{ id: number, titulo: string, mensaje: string }>,
 *   onCerrar: (id: number) => void
 * }} props
 */
export function NotificacionesToastContainer({ notificaciones, onCerrar }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] px-3 sm:bottom-4 sm:px-4 lg:bottom-4"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="mx-auto flex max-w-[1280px] justify-end">
        <ul className="w-full max-w-sm space-y-2">
          <AnimatePresence initial={false}>
            {notificaciones.map((notificacion) => (
              <li key={notificacion.id}>
                <NotificacionToast notificacion={notificacion} onCerrar={onCerrar} />
              </li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}

export default NotificacionToast;
