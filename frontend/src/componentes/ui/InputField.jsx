import { cn } from './cn';

export default function InputField({
  label,
  id,
  hint = '',
  error = '',
  required = false,
  className = '',
  inputClassName = '',
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

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'w-full min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
          inputClassName
        )}
        {...props}
      />

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
