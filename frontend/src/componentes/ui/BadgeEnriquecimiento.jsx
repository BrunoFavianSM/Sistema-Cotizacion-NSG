/**
 * BadgeEnriquecimiento
 *
 * Indicador visual del estado de enriquecimiento IA de un producto.
 * Muestra el origen de los datos técnicos: CSV, completado por IA,
 * fallido, pendiente o sin enriquecimiento (no aplica).
 *
 * Accesibilidad:
 *   - role="status" + aria-label descriptivo en cada badge (WCAG AA)
 *   - El badge ia_fallido es interactivo: role="button", teclado (Enter/Space)
 *   - Touch target mínimo 44×44 px en ia_fallido (clickeable)
 *   - animate-pulse respeta prefers-reduced-motion
 *   - Dark mode completo vía tokens CSS
 *
 * Valida Requisitos: 6.1, 6.2, 6.6, 6.7, Restricción UI 7, 8, 10, 11
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from './cn';

// ─── Configuración de estados ────────────────────────────────────────────────

/**
 * Mapa de configuración por estado de enriquecimiento.
 * null → no renderizar badge (no_aplica).
 */
const CONFIG_BADGE = {
  csv: {
    texto: 'Datos CSV',
    // bg semitransparente sobre token de color para dark mode automático
    claseColor: 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]',
    pulso: false,
    clickeable: false,
  },
  enriquecido: {
    texto: 'Completo',
    claseColor: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]',
    pulso: false,
    clickeable: false,
  },
  fallido: {
    texto: 'Falló',
    claseColor: 'bg-[color:rgba(255,69,58,0.16)] text-[var(--color-danger)]',
    pulso: false,
    clickeable: true,
  },
  pendiente: {
    texto: 'Pendiente',
    claseColor: 'bg-[color:rgba(255,214,10,0.16)] text-[var(--color-warning)]',
    pulso: true,
    clickeable: false,
  },
  no_aplica: null,
};

// ─── Hook: prefers-reduced-motion ────────────────────────────────────────────

function usePrefersReducedMotion() {
  const [reducido, setReducido] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReducido(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reducido;
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * @param {{
 *   estado: string,
 *   onClick?: () => void
 * }} props
 *
 * @param estado  - Valor de estado_enriquecimiento del producto.
 * @param onClick - Callback opcional para el badge ia_fallido (clickeable).
 */
export default function BadgeEnriquecimiento({ estado, onClick }) {
  const config = CONFIG_BADGE[estado] ?? null;
  const prefersReducedMotion = usePrefersReducedMotion();

  // Estado local para accesibilidad de teclado en badge clickeable
  const badgeRef = useRef(null);

  // No renderizar nada para no_aplica o estados desconocidos
  if (!config) return null;

  const { texto, claseColor, pulso, clickeable } = config;
  const mostrarPulso = pulso && !prefersReducedMotion;

  // ── Badge clickeable (ia_fallido) ──────────────────────────────────────────
  if (clickeable) {
    return (
      <button
        ref={badgeRef}
        type="button"
        role="status"
        aria-label={`Estado de datos: ${texto}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          // Touch target mínimo 44×44 px (Restricción UI 8)
          'inline-flex items-center justify-center rounded-full px-2.5 py-1',
          'text-xs font-medium',
          'min-h-[44px] min-w-[44px]',
          // Interactividad visual
          'cursor-pointer transition-opacity duration-150',
          'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-1',
          claseColor
        )}
      >
        {texto}
      </button>
    );
  }

  // ── Badge estático (csv, ia_completado, pendiente) ─────────────────────────
  return (
    <span
      role="status"
      aria-label={`Estado de datos: ${texto}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-xs font-medium',
        mostrarPulso && 'animate-pulse',
        claseColor
      )}
    >
      {/* Punto indicador para estado pendiente */}
      {pulso && (
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]',
            mostrarPulso && 'animate-pulse'
          )}
        />
      )}
      {texto}
    </span>
  );
}
