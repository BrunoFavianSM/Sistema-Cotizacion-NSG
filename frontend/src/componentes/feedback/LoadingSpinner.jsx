import { cn } from '../ui/cn';

const SIZE_STYLES = {
  sm: {
    spinner: 'h-4 w-4 border-2',
    text: 'text-xs',
  },
  md: {
    spinner: 'h-5 w-5 border-2',
    text: 'text-sm',
  },
  lg: {
    spinner: 'h-7 w-7 border-[3px]',
    text: 'text-base',
  },
};

export default function LoadingSpinner({
  label = 'Cargando...',
  size = 'md',
  inline = false,
  className = '',
}) {
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={cn(
        inline ? 'inline-flex' : 'flex',
        'items-center justify-center gap-2 text-[var(--color-text-muted)]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-[var(--color-border)] border-t-[var(--color-accent)]',
          styles.spinner
        )}
        aria-hidden="true"
      />
      <span className={cn('font-medium', styles.text)}>{label}</span>
    </div>
  );
}
