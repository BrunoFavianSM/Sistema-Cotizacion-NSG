import { cn } from './cn';

const VARIANT_STYLES = {
  neutral: 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]',
  success: 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]',
  warning: 'bg-[color:rgba(255,214,10,0.16)] text-[var(--color-warning)]',
  danger: 'bg-[color:rgba(255,69,58,0.16)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANT_STYLES[variant] || VARIANT_STYLES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
