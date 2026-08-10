import { cn } from '../ui/cn';

function SuccessIcon() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(48,209,88,0.16)] text-[var(--color-success)]"
      aria-hidden="true"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function SuccessState({
  title = 'Acción completada',
  description = '',
  children = null,
  className = '',
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-md)] border border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)] p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <SuccessIcon />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-success)]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-text)]">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
