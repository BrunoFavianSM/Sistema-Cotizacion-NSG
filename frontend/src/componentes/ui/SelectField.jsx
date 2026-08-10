import { cn } from './cn';

export default function SelectField({
  label,
  id,
  hint = '',
  error = '',
  required = false,
  options = [],
  className = '',
  selectClassName = '',
  ...props
}) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required ? <span className="ml-1 text-[var(--color-danger)]">*</span> : null}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-required={required || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'w-full min-h-11 appearance-none rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 pr-9 text-[var(--color-text)] transition-colors duration-higNormal ease-hig',
            error
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
            selectClassName
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
