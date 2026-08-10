/**
 * ValidandoIndicador.jsx
 *
 * Indicador discreto de "Validando configuración..." que aparece
 * mientras el Double-Check está en curso en el backend.
 * Desaparece automáticamente cuando el backend retorna la respuesta.
 * Respeta prefers-reduced-motion (sin spinner animado si está activo).
 *
 * Requisitos: 13.2
 */

import { useEffect, useState } from 'react';

export default function ValidandoIndicador({ visible = false }) {
  // Detectar preferencia de movimiento reducido
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducirMovimiento(mediaQuery.matches);

    const manejarCambio = (e) => setReducirMovimiento(e.matches);
    mediaQuery.addEventListener('change', manejarCambio);
    return () => mediaQuery.removeEventListener('change', manejarCambio);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Validando configuración de componentes"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] w-fit"
    >
      {/* Spinner SVG — se omite la animación si prefers-reduced-motion está activo */}
      {!reducirMovimiento && (
        <svg
          className="h-3.5 w-3.5 text-[var(--color-accent)] animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {/* Icono estático cuando se reduce el movimiento */}
      {reducirMovimiento && (
        <svg
          className="h-3.5 w-3.5 text-[var(--color-accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}

      <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
        Validando configuración...
      </span>
    </div>
  );
}
