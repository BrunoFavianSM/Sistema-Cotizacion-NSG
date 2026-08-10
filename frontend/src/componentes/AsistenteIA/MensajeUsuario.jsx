/**
 * MensajeUsuario.jsx
 *
 * Burbuja de mensaje del usuario.
 * - border-radius: 24px 24px 4px 24px
 * - max-width: 80%, padding: 12px 16px
 * - bg: accent, texto blanco
 * - Timestamp en text-[11px] alineado a la derecha
 *
 * Requisitos: 9.4, 9.5, 9.1
 */

/**
 * Formatea un timestamp a hora legible en español
 */
function formatearHora(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Props:
 * - contenido: string — texto del mensaje
 * - timestamp: string | Date — momento del mensaje
 */
export default function MensajeUsuario({ contenido, timestamp }) {
  const hora = formatearHora(timestamp);

  return (
    <div className="flex max-w-[82%] flex-col items-end gap-1.5 self-end">
      {/* Burbuja principal */}
      <div
        className={[
          'rounded-[18px] rounded-br-md px-4 py-3',
          'bg-[var(--color-accent)] text-white shadow-[var(--shadow-1)]',
          'text-sm leading-relaxed',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap break-words">{contenido}</p>
      </div>

      {/* Timestamp */}
      {hora && (
        <span
          className="text-[11px] text-[var(--color-text-muted)] px-1"
          aria-label={`Enviado a las ${hora}`}
        >
          {hora}
        </span>
      )}
    </div>
  );
}
