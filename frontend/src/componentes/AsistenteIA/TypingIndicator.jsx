/**
 * TypingIndicator.jsx
 *
 * Indicador animado de "el asistente está escribiendo".
 * Tres puntos con animación bounce escalonada.
 * Respeta prefers-reduced-motion deshabilitando la animación.
 *
 * Requisitos: 9.2, 9.3, 9.9, 13.1
 */

import { useEffect, useState } from 'react';

export default function TypingIndicator() {
  // Detectar preferencia de movimiento reducido
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducirMovimiento(mediaQuery.matches);

    const manejarCambio = (e) => setReducirMovimiento(e.matches);
    mediaQuery.addEventListener('change', manejarCambio);
    return () => mediaQuery.removeEventListener('change', manejarCambio);
  }, []);

  return (
    <div
      role="status"
      aria-label="El asistente está escribiendo"
      className="flex items-center gap-1 px-4 py-3"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={[
            'h-2 w-2 rounded-full bg-[var(--color-text-muted)]',
            reducirMovimiento ? '' : 'animate-bounce',
          ].join(' ')}
          style={
            reducirMovimiento
              ? {}
              : {
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '0.6s',
                }
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
