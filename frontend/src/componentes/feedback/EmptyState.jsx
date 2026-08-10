import Button from '../ui/Button';
import { cn } from '../ui/cn';

function EmptyIcon() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
      aria-hidden="true"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M3 7.5V16.5L12 21l9-4.5V7.5" />
      </svg>
    </span>
  );
}

export default function EmptyState({
  title = 'No hay datos disponibles',
  description = 'Cuando existan resultados, aparecerán aquí.',
  actionLabel = '',
  onAction = null,
  className = '',
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-3 flex justify-center">
        <EmptyIcon />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">{description}</p>

      {actionLabel && onAction ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
