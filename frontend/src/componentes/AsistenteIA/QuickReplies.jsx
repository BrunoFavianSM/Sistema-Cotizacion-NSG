/**
 * QuickReplies.jsx
 *
 * Burbujas de respuesta rápida scrolleables horizontalmente.
 * - min-height 44px, padding 8px 16px, border-radius 20px, borde accent
 * - Animación fade-in 200ms (respeta prefers-reduced-motion)
 * - Navegación por teclado: Tab para moverse, Enter para seleccionar
 * - Al seleccionar llama onSeleccionar(texto) y desaparece
 *
 * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 9.6
 */

import { useEffect, useRef, useState } from 'react';

export default function QuickReplies({ opciones = [], onSeleccionar }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [visible, setVisible] = useState(false);
  const contenedorRef = useRef(null);

  // Animación de entrada al montar
  useEffect(() => {
    if (opciones.length > 0) {
      // Pequeño delay para que el fade-in sea perceptible
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [opciones]);

  // Si no hay opciones o ya se seleccionó una, no renderizar
  if (opciones.length === 0 || seleccionado !== null) return null;

  const manejarSeleccion = (texto) => {
    setSeleccionado(texto);
    if (onSeleccionar) onSeleccionar(texto);
  };

  const manejarTeclado = (e, texto) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      manejarSeleccion(texto);
    }
  };

  return (
    <div
      ref={contenedorRef}
      role="group"
      aria-label="Respuestas rápidas disponibles"
      className={[
        'flex gap-2 overflow-x-auto pb-1 px-1',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
        // Ocultar scrollbar visualmente pero mantener funcionalidad
        '[&::-webkit-scrollbar]:h-1',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-[var(--color-border)]',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
      ].join(' ')}
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border) transparent' }}
    >
      {opciones.map((texto, indice) => (
        <button
          key={`${texto}-${indice}`}
          type="button"
          onClick={() => manejarSeleccion(texto)}
          onKeyDown={(e) => manejarTeclado(e, texto)}
          aria-label={`Respuesta rápida: ${texto}`}
          className={[
            // Dimensiones y forma
            'flex-shrink-0 min-h-11 rounded-full px-4 py-2',
            // Colores y borde
            'border border-[color:color-mix(in_srgb,var(--color-accent)_40%,var(--color-border))] text-[var(--color-accent)]',
            'bg-[var(--color-surface)] hover:bg-[var(--color-accent-soft)]',
            // Tipografía
            'text-sm font-medium whitespace-nowrap shadow-[var(--shadow-1)]',
            // Interacción
            'cursor-pointer select-none',
            'transition-colors duration-higFast ease-hig',
            // Foco accesible
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2',
            'focus-visible:ring-offset-[var(--color-bg)]',
            // Estado activo
            'active:scale-95 transition-transform',
          ].join(' ')}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
