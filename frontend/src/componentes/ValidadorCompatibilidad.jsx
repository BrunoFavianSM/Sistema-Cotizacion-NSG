/**
 * Componente Validador de Compatibilidad
 * 
 * Muestra en tiempo real los resultados de la validación de compatibilidad
 * que viene del backend. Características:
 * - Muestra errores de incompatibilidad con mensajes descriptivos
 * - Muestra advertencias (fuente ajustada, componentes a pedido)
 * - Diseño claro con iconos y colores
 * - Animaciones suaves con Framer Motion
 * 
 * Valida Requisitos: 3.3, 3.4
 */

import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const ValidadorCompatibilidad = ({
  resultadoValidacion,
  mostrar = true,
  validando = false,
  className = ''
}) => {
  const reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Si no hay resultado o no se debe mostrar, no renderizar nada
  if (!mostrar || !resultadoValidacion) {
    return null;
  }

  const { compatible, errores = [], advertencias = [] } = resultadoValidacion;

  // Si no hay errores ni advertencias, no mostrar nada
  if (errores.length === 0 && advertencias.length === 0) {
    return null;
  }

  // Variantes de animación
  const variantesContenedor = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.3,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: reducedMotion ? 0 : 0.2 }
    }
  };

  const variantesItem = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={variantesContenedor}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`validador-compatibilidad ${className}`}
      >
        {validando && (
          <motion.div
            variants={variantesItem}
            className="mb-3 flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm text-[var(--color-text-muted)]"
            role="status"
            aria-live="polite"
          >
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
            Validando compatibilidad de componentes...
          </motion.div>
        )}

        {/* Errores de incompatibilidad */}
        {errores.length > 0 && (
          <motion.div
            variants={variantesItem}
            role="alert"
            className="mb-4 rounded-[var(--radius-md)] border-l-4 border-[var(--color-danger)] bg-[color:rgba(255,69,58,0.10)] p-4 shadow-[var(--shadow-1)]"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-[var(--color-danger)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  Incompatibilidades Detectadas
                  <span className="ml-2 rounded-full bg-[color:rgba(255,69,58,0.16)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-danger)]">Crítico</span>
                </h3>
                <ul className="space-y-2">
                  {errores.map((error, index) => (
                    <motion.li
                      key={index}
                      variants={variantesItem}
                      className="flex items-start text-sm text-[var(--color-text)]"
                    >
                      <span className="mr-2 flex-shrink-0 text-[var(--color-danger)]">•</span>
                      <span className="flex-1">{error}</span>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-[var(--color-danger)]">
                  Por favor, ajusta tu selección para resolver estas incompatibilidades.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Advertencias */}
        {advertencias.length > 0 && (
          <motion.div
            variants={variantesItem}
            role="status"
            className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-warning)] bg-[color:rgba(255,159,10,0.10)] p-4 shadow-[var(--shadow-1)]"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-[var(--color-warning)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  Advertencias
                  <span className="ml-2 rounded-full bg-[color:rgba(255,159,10,0.16)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">Advertencia</span>
                </h3>
                <ul className="space-y-2">
                  {advertencias.map((advertencia, index) => (
                    <motion.li
                      key={index}
                      variants={variantesItem}
                      className="flex items-start text-sm text-[var(--color-text)]"
                    >
                      <span className="mr-2 flex-shrink-0 text-[var(--color-warning)]">•</span>
                      <span className="flex-1">{advertencia}</span>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">
                  Tu configuración es compatible, pero considera estas recomendaciones.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mensaje de éxito (solo si es compatible y no hay advertencias) */}
        {compatible && errores.length === 0 && advertencias.length === 0 && (
          <motion.div
            variants={variantesItem}
            role="status"
            className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-success)] bg-[color:rgba(48,209,88,0.10)] p-4 shadow-[var(--shadow-1)]"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-[var(--color-success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  ¡Configuración Compatible!
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Todos los componentes son compatibles entre sí.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

ValidadorCompatibilidad.propTypes = {
  resultadoValidacion: PropTypes.shape({
    compatible: PropTypes.bool.isRequired,
    errores: PropTypes.arrayOf(PropTypes.string),
    advertencias: PropTypes.arrayOf(PropTypes.string)
  }),
  mostrar: PropTypes.bool,
  validando: PropTypes.bool,
  className: PropTypes.string
};

export default ValidadorCompatibilidad;

