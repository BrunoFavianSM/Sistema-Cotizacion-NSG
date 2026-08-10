/**
 * RutaUpgrade.jsx
 *
 * Sección colapsable con guía de upgrades futuros para la configuración propuesta.
 * - Componente de mayor potencial de upgrade (RAM o GPU)
 * - Costo aproximado en PEN de upgrades comunes
 * - Slots disponibles (M.2, RAM) si la placa madre los tiene
 * - Advertencia si procesador o placa madre limitan upgrades futuros
 *
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState } from 'react';

// Icono de flecha para colapsar/expandir
const IconoChevron = ({ expandido }) => (
  <svg
    viewBox="0 0 24 24"
    className={[
      'h-4 w-4 fill-none stroke-current stroke-2',
      'transition-transform duration-200',
      expandido ? 'rotate-180' : 'rotate-0',
    ].join(' ')}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// Icono de upgrade (flecha hacia arriba)
const IconoUpgrade = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-[var(--color-accent)] stroke-[1.5] flex-shrink-0"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);

// Icono de advertencia
const IconoAdvertencia = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-[var(--color-warning)] stroke-2 flex-shrink-0"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

// Icono de slot disponible
const IconoSlot = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-[var(--color-success)] stroke-[1.5] flex-shrink-0"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Formatea precio en PEN
 */
function formatearPrecioPEN(monto) {
  if (!monto) return '—';
  return `S/ ${Number(monto).toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Props:
 * - rutaUpgrade: objeto con la información de upgrades
 *   {
 *     componentePrincipal: { tipo: 'ram'|'gpu', nombre: string, descripcion: string },
 *     upgrades: [{ nombre: string, descripcion: string, costoAproximadoPen: number }],
 *     slotsDisponibles: [{ tipo: 'm2'|'ram', cantidad: number, descripcion: string }],
 *     limitaciones: string[] — advertencias sobre limitaciones de upgrades
 *   }
 */
export default function RutaUpgrade({ rutaUpgrade }) {
  const [expandido, setExpandido] = useState(false);

  if (!rutaUpgrade) return null;

  const {
    componentePrincipal,
    upgrades = [],
    slotsDisponibles = [],
    limitaciones = [],
  } = rutaUpgrade;

  const tieneContenido =
    componentePrincipal || upgrades.length > 0 || slotsDisponibles.length > 0 || limitaciones.length > 0;

  if (!tieneContenido) return null;

  const manejarTeclado = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpandido((prev) => !prev);
    }
  };

  return (
    <section
      aria-label="Ruta de upgrade futuro"
      className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
    >
      {/* Encabezado colapsable */}
      <button
        type="button"
        onClick={() => setExpandido((prev) => !prev)}
        onKeyDown={manejarTeclado}
        aria-expanded={expandido}
        aria-controls="ruta-upgrade-contenido"
        className={[
          'flex items-center justify-between w-full px-4 py-3',
          'text-left cursor-pointer',
          'hover:bg-[var(--color-surface-soft)]',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-focus)] focus-visible:ring-inset',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <IconoUpgrade />
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Ruta de upgrade
          </span>
          {componentePrincipal && (
            <span className="text-xs text-[var(--color-text-muted)]">
              · Mejor opción: {componentePrincipal.tipo === 'ram' ? 'RAM' : 'GPU'}
            </span>
          )}
        </div>
        <IconoChevron expandido={expandido} />
      </button>

      {/* Contenido colapsable */}
      {expandido && (
        <div
          id="ruta-upgrade-contenido"
          className="px-4 pb-4 flex flex-col gap-4 border-t border-[var(--color-border)]"
        >
          {/* Componente principal de upgrade */}
          {componentePrincipal && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Mayor potencial de mejora
              </p>
              <div className="flex items-start gap-2 p-3 rounded-[10px] bg-[var(--color-accent-soft)]">
                <IconoUpgrade />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {componentePrincipal.nombre}
                  </p>
                  {componentePrincipal.descripcion && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {componentePrincipal.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de upgrades con costos */}
          {upgrades.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Upgrades comunes
              </p>
              <div className="flex flex-col gap-2">
                {upgrades.map((upgrade, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-[var(--color-text)]">{upgrade.nombre}</span>
                      {upgrade.descripcion && (
                        <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {upgrade.descripcion}
                        </span>
                      )}
                    </div>
                    {upgrade.costoAproximadoPen && (
                      <span className="text-sm font-semibold text-[var(--color-text)] flex-shrink-0 tabular-nums">
                        ~{formatearPrecioPEN(upgrade.costoAproximadoPen)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slots disponibles */}
          {slotsDisponibles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Slots disponibles
              </p>
              <div className="flex flex-col gap-1.5">
                {slotsDisponibles.map((slot, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <IconoSlot />
                    <p className="text-sm text-[var(--color-text)]">
                      {slot.cantidad > 1 ? `${slot.cantidad}x ` : ''}
                      {slot.tipo === 'm2' ? 'Slot M.2' : 'Slot RAM'}
                      {slot.descripcion && (
                        <span className="text-[var(--color-text-muted)]"> — {slot.descripcion}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitaciones de upgrade */}
          {limitaciones.length > 0 && (
            <div
              role="alert"
              aria-label="Limitaciones de upgrade"
              className="rounded-[10px] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-3 py-2.5"
            >
              <div className="flex flex-col gap-1.5">
                {limitaciones.map((limitacion, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <IconoAdvertencia />
                    <p className="text-xs text-[var(--color-warning)] leading-snug">
                      {limitacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
