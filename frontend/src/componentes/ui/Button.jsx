import { cn } from './cn';

const VARIANT_STYLES = {
  primary: 'bg-[var(--color-accent-solid)] text-[var(--color-on-accent)] hover:opacity-90 focus-visible:outline-[var(--color-accent)]',
  secondary: 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
  ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
  danger: 'bg-[var(--color-danger-solid)] text-[var(--color-on-danger)] hover:opacity-90',
  success: 'bg-[var(--color-success-solid)] text-[var(--color-on-success)] hover:opacity-90',
};

const SIZE_STYLES = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-all duration-higNormal ease-hig disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_STYLES[variant] || VARIANT_STYLES.primary,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
