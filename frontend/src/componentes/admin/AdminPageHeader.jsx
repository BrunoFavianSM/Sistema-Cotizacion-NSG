export default function AdminPageHeader({ eyebrow = 'Administración', title, description, actions = null }) {
  return (
    <header className="surface-elevated p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
