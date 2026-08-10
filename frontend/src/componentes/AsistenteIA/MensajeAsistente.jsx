/**
 * MensajeAsistente.jsx
 *
 * Burbuja de mensaje del asistente IA. Renderiza el contenido como Markdown
 * (GFM: negritas, listas, tablas) para que las respuestas se vean formateadas.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Formatea un timestamp a hora legible en espanol.
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

// Overrides de estilo para los elementos Markdown (sin depender de plugins de tipografía).
const componentesMarkdown = {
  p: ({ children }) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline text-[var(--color-accent)]">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-[var(--color-border)]" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--color-surface-soft)]">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-[var(--color-border)] px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--color-border)] px-2 py-1 align-top">{children}</td>
  ),
  code: ({ children }) => (
    <code className="rounded bg-[var(--color-surface-soft)] px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
};

export default function MensajeAsistente({ contenido, timestamp, children }) {
  const hora = formatearHora(timestamp);

  return (
    <div className="flex max-w-[82%] flex-col items-start gap-1.5">
      <div
        className={[
          'rounded-[18px] rounded-bl-md px-4 py-3',
          'border border-[var(--color-border)] bg-[var(--color-surface)]',
          'text-[var(--color-text)] shadow-[var(--shadow-1)]',
          'text-sm leading-relaxed',
        ].join(' ')}
      >
        {contenido && (
          <div className="break-words text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentesMarkdown}>
              {String(contenido)}
            </ReactMarkdown>
          </div>
        )}

        {children && (
          <div className="mt-3 flex flex-col gap-3">
            {children}
          </div>
        )}
      </div>

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
