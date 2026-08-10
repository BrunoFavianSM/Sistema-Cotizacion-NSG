export default function FormSection({ title, description = '', children }) {
  return (
    <section className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
      <header>
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
