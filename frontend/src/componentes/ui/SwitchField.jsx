import { cn } from './cn';

export default function SwitchField({
  id,
  label,
  description = '',
  checked,
  onChange,
  className = '',
  disabled = false,
}) {
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cn('flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3', className)}>
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-1 text-xs text-[var(--color-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-higNormal ease-hig',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'pointer-events-none relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-higNormal ease-hig',
            checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 h-5 w-5 transform rounded-full bg-white transition-transform duration-higNormal ease-hig',
              checked ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </span>
      </button>
    </div>
  );
}
