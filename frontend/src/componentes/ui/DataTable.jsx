import { useId, useMemo, useState } from 'react';
import InputField from './InputField';
import { cn } from './cn';

function compareValues(left, right, direction) {
  const a = left ?? '';
  const b = right ?? '';

  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  const result = String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

export default function DataTable({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  loadingState = null,
  caption = '',
  searchKeys = [],
  searchPlaceholder = 'Buscar',
  leftToolbar = null,
  rightToolbar = null,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No hay elementos para mostrar con los filtros actuales.',
  emptyState = null,
  defaultSort = null,
}) {
  const tableId = useId();
  const searchId = `${tableId}-search`;

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(defaultSort);

  const filteredData = useMemo(() => {
    if (!query.trim() || searchKeys.length === 0) return data;
    const term = query.trim().toLowerCase();

    return data.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(term))
    );
  }, [data, query, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sort?.key) return filteredData;
    const copy = [...filteredData];

    copy.sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.direction));
    return copy;
  }, [filteredData, sort]);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  return (
    <div className="surface-elevated overflow-hidden" aria-busy={loading}>
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <InputField
              id={searchId}
              label="Buscar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="sm:min-w-[16rem] sm:max-w-md"
            />
            {leftToolbar}
          </div>
          {rightToolbar}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              {columns.map((column) => {
                const activeSort = sort?.key === column.key ? sort.direction : null;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      column.sortable
                        ? (activeSort === 'asc' ? 'ascending' : activeSort === 'desc' ? 'descending' : 'none')
                        : undefined
                    }
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Ordenar por ${column.label}${activeSort === 'asc' ? ', descendente' : ', ascendente'}`}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-1 text-inherit transition-colors duration-higNormal ease-hig hover:text-[var(--color-text)]',
                          column.align === 'right' && 'ml-auto'
                        )}
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">
                          {activeSort === 'asc' ? '↑' : activeSort === 'desc' ? '↓' : '↕'}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  {loadingState || 'Cargando datos...'}
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  {emptyState || (
                    <>
                      <p className="text-sm font-medium text-[var(--color-text)]">{emptyTitle}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{emptyDescription}</p>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row[rowKey]} className="border-t border-[var(--color-border)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)]/65">
                  {columns.map((column) => (
                    <td
                      key={`${row[rowKey]}-${column.key}`}
                      className={cn(
                        'px-4 py-3 text-sm text-[var(--color-text)]',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
