import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/**
 * Imagen de producto/componente a partir de una URL externa (Icecat/Deltron).
 *
 * - Si no hay `src` válido, no renderiza nada (sin caja vacía).
 * - Si la imagen falla al cargar, se oculta (sin ícono de imagen rota).
 * - Carga diferida y decodificación asíncrona para no bloquear el render.
 * - Contenedor con tokens globales (compatible con dark mode).
 * - `ampliable` (por defecto true): al hacer clic abre la imagen en pantalla
 *   completa (modal/lightbox) para verla más grande.
 */
export default function ImagenProducto({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  ampliable = true,
}) {
  const [conError, setConError] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const disparadorRef = useRef(null);

  // Reiniciar el estado de error si cambia la URL (reuso de la tarjeta en listas).
  useEffect(() => {
    setConError(false);
  }, [src]);

  const url = typeof src === 'string' ? src.trim() : '';
  if (!url || conError) return null;

  const imagen = (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setConError(true)}
      className={cn('max-h-40 w-full object-contain', imgClassName)}
    />
  );

  const contenedorClass = cn(
    'flex items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3',
    className
  );

  if (!ampliable) {
    return <div className={contenedorClass}>{imagen}</div>;
  }

  return (
    <>
      <button
        type="button"
        ref={disparadorRef}
        onClick={() => setAmpliada(true)}
        aria-label={alt ? `Ampliar imagen: ${alt}` : 'Ampliar imagen'}
        className={cn(
          contenedorClass,
          'cursor-zoom-in transition-colors hover:border-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]'
        )}
      >
        {imagen}
      </button>

      {ampliada ? (
        <LightboxImagen
          src={url}
          alt={alt}
          onClose={() => setAmpliada(false)}
          devolverFocoA={disparadorRef}
        />
      ) : null}
    </>
  );
}

/** Modal a pantalla completa para ver la imagen ampliada. */
function LightboxImagen({ src, alt, onClose, devolverFocoA }) {
  const cerrarRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Bloquear scroll del fondo mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial en el botón de cerrar (accesibilidad/teclado).
    cerrarRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
      // Devolver el foco al disparador al cerrar.
      devolverFocoA?.current?.focus();
    };
  }, [onClose, devolverFocoA]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Imagen ampliada'}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm motion-safe:animate-fadeIn"
    >
      <button
        type="button"
        ref={cerrarRef}
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <img
        src={src}
        alt={alt}
        // Evita que el clic sobre la imagen cierre el modal (solo el fondo cierra).
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-[var(--radius-md)] object-contain shadow-2xl"
      />
    </div>,
    document.body
  );
}
