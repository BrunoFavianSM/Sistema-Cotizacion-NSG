import Button from '../ui/Button';
import { cn } from '../ui/cn';

function ErrorIcon() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(255,69,58,0.16)] text-[var(--color-danger)]"
      aria-hidden="true"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v5m0 3h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.3 3.8L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" />
      </svg>
    </span>
  );
}

export default function ErrorState({
  title = 'No se pudo completar la acción',
  description = 'Intenta nuevamente en unos segundos.',
  retryLabel = 'Reintentar',
  onRetry = null,
  className = '',
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-md)] border border-[color:rgba(255,69,58,0.38)] bg-[color:rgba(255,69,58,0.10)] p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <ErrorIcon />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-danger)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text)]">{description}</p>
        </div>
      </div>

      {onRetry ? (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
