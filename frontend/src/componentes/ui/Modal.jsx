import { useCallback, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from './cn';
import { crearTour } from '../../tours/driver.config';

export default function Modal({
  open,
  title,
  description = '',
  onClose,
  children,
  footer = null,
  size = 'md',
  pasosTour = null,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const tourRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const tieneTour = Array.isArray(pasosTour) && pasosTour.length > 0;

  // Lanza un mini-tour que explica los campos de este modal. Se ejecuta a
  // demanda (botón de ayuda), no automáticamente, para no interrumpir.
  const lanzarMiniTour = useCallback(() => {
    if (!tieneTour) return;
    if (tourRef.current) {
      tourRef.current.destroy();
      tourRef.current = null;
    }
    const instancia = crearTour({
      pasos: pasosTour,
      onFinalizar: () => {
        tourRef.current = null;
      },
    });
    tourRef.current = instancia;
    instancia.drive();
  }, [pasosTour, tieneTour]);

  // Cierra el mini-tour si el modal se cierra o desmonta.
  useEffect(() => {
    if (open) return undefined;
    if (tourRef.current) {
      tourRef.current.destroy();
      tourRef.current = null;
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables.length > 0) {
        const prioridad = focusables.find((item) => item.matches('[data-autofocus="true"]'));
        const sinCerrar = focusables.find((item) => !item.matches('[data-modal-close="true"]'));
        const objetivo = prioridad || sinCerrar || focusables[0];
        objetivo.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    });

    const onKeyDown = (event) => {
      // Si hay un mini-tour activo, dejamos que driver.js maneje el teclado
      // (Escape cierra el tour, no el modal; el foco lo controla driver).
      if (tourRef.current) return;

      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = getFocusable();
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const isShift = event.shiftKey;

        if (!isShift && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (isShift && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open]);

  const widthClass = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size] || 'max-w-2xl';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'surface-elevated relative z-10 w-full max-h-[90vh] overflow-y-auto p-6',
              widthClass
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
          >
            <header className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
              <div>
                <h2 id={titleId} className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
                {description ? <p id={descriptionId} className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
              </div>
              <div className="flex items-center gap-1">
                {tieneTour ? (
                  <button
                    type="button"
                    onClick={lanzarMiniTour}
                    tabIndex={-1}
                    className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                    aria-label="Ver guía de este formulario"
                    title="Ver guía de este formulario"
                  >
                    <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.4 9.2a2.7 2.7 0 015.1 1.2c0 1.8-2.5 2.2-2.5 3.9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 17.2h.01" />
                    </svg>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  data-modal-close="true"
                  className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                  aria-label="Cerrar diálogo"
                >
                  <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </header>

            <div>{children}</div>

            {footer ? (
              <footer className="mt-6 border-t border-[var(--color-border)] pt-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

