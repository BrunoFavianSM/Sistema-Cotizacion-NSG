/**
 * ResumenFinancieroAdmin
 *
 * Panel de resumen financiero extendido para el administrador.
 * Muestra el desglose completo de la fórmula de cálculo en USD y PEN.
 * Visible únicamente cuando el usuario está autenticado como admin.
 *
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 11.5
 */

import { useMemo } from 'react';
import { useAppContext } from '../../contexto/AppContext';

/**
 * Formatea un número como moneda con 2 decimales.
 * @param {number} monto
 * @param {string} simbolo - Prefijo de moneda (ej: "$", "S/")
 * @returns {string}
 */
function formatearMonto(monto, simbolo = '$') {
  const valor = typeof monto === 'number' && isFinite(monto) ? monto : 0;
  return `${simbolo}${valor.toFixed(2)}`;
}

/**
 * @param {object} props
 * @param {object} props.resumen    - Resultado de calcularResumenFinancieroAdmin()
 * @param {number} props.tipoCambio - Tipo de cambio USD → PEN vigente
 */
export default function ResumenFinancieroAdmin({ resumen, tipoCambio }) {
  const { autenticado } = useAppContext();

  // Guard: solo visible para admin autenticado (Requisito 7.11)
  if (!autenticado) return null;

  // ── Montos PEN calculados con useMemo (Requisito 4.4) ────────────────────
  // Se recalculan solo cuando cambia el resumen o el tipo de cambio.
  const montosPen = useMemo(() => {
    const tc = typeof tipoCambio === 'number' && tipoCambio > 0 ? tipoCambio : 1;
    return {
      costo_cpu_pen:               parseFloat(((resumen?.costo_cpu_usd               ?? 0) * tc).toFixed(2)),
      costo_cpu_perifericos_pen:   parseFloat(((resumen?.costo_cpu_perifericos_usd   ?? 0) * tc).toFixed(2)),
      utilidad_pen:                parseFloat(((resumen?.utilidad_usd                ?? 0) * tc).toFixed(2)),
      precio_venta_pen:            parseFloat(((resumen?.precio_venta_usd            ?? 0) * tc).toFixed(2)),
      igv_pen:                     parseFloat(((resumen?.igv_usd                     ?? 0) * tc).toFixed(2)),
      precio_final_pen:            parseFloat(((resumen?.precio_final_usd            ?? 0) * tc).toFixed(2)),
    };
  }, [resumen, tipoCambio]);

  // ── Filas de la tabla ─────────────────────────────────────────────────────
  const filas = [
    {
      id: 'costo-cpu',
      etiqueta: 'Costo CPU',
      descripcion: '7 componentes + embalaje + flete',
      montoUsd: resumen?.costo_cpu_usd ?? 0,
      montoPen: montosPen.costo_cpu_pen,
      destacado: false,
    },
    {
      id: 'costo-cpu-perifericos',
      etiqueta: 'Costo CPU + Periféricos',
      descripcion: 'Costo CPU + extras seleccionados',
      montoUsd: resumen?.costo_cpu_perifericos_usd ?? 0,
      montoPen: montosPen.costo_cpu_perifericos_pen,
      destacado: false,
    },
    {
      id: 'utilidad',
      etiqueta: 'Utilidad',
      descripcion: 'Margen de ganancia aplicado',
      montoUsd: resumen?.utilidad_usd ?? 0,
      montoPen: montosPen.utilidad_pen,
      destacado: false,
    },
    {
      id: 'precio-venta',
      etiqueta: 'Precio de Venta',
      descripcion: 'Costo + Utilidad (sin IGV)',
      montoUsd: resumen?.precio_venta_usd ?? 0,
      montoPen: montosPen.precio_venta_pen,
      destacado: false,
    },
    {
      id: 'igv',
      etiqueta: 'IGV',
      descripcion: 'Impuesto General a las Ventas',
      montoUsd: resumen?.igv_usd ?? 0,
      montoPen: montosPen.igv_pen,
      destacado: false,
    },
    {
      id: 'precio-final',
      etiqueta: 'Precio Final',
      descripcion: 'Precio de Venta + IGV',
      montoUsd: resumen?.precio_final_usd ?? 0,
      montoPen: montosPen.precio_final_pen,
      destacado: true,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      aria-labelledby="resumen-financiero-titulo"
      className="surface-card overflow-hidden"
    >
      {/* Encabezado */}
      <div className="flex min-h-[44px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
        {/* Ícono de calculadora */}
        <svg
          className="h-4 w-4 shrink-0 text-[var(--color-accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="10" y2="10" />
          <line x1="14" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="10" y2="14" />
          <line x1="14" y1="14" x2="16" y2="14" />
          <line x1="8" y1="18" x2="10" y2="18" />
          <line x1="14" y1="18" x2="16" y2="18" />
        </svg>
        <h2
          id="resumen-financiero-titulo"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          Resumen Financiero
        </h2>
      </div>

      {/* Tabla de desglose */}
      <div className="px-4 py-3">
        <table
          className="w-full border-collapse text-sm"
          aria-label="Desglose financiero en USD y PEN"
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
              >
                Concepto
              </th>
              <th
                scope="col"
                className="pb-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
              >
                USD
              </th>
              <th
                scope="col"
                className="pb-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
              >
                PEN
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indice) => (
              <tr
                key={fila.id}
                className={[
                  'transition-colors duration-higFast',
                  fila.destacado
                    ? 'border-t border-[var(--color-border)]'
                    : '',
                  indice < filas.length - 1 && !filas[indice + 1]?.destacado
                    ? 'border-b border-[var(--color-border)] border-opacity-40'
                    : '',
                ].join(' ')}
              >
                {/* Etiqueta */}
                <td
                  className={[
                    'py-2 pr-3',
                    fila.destacado
                      ? 'pt-3 font-semibold text-[var(--color-text)]'
                      : 'text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <span className={fila.destacado ? 'text-sm' : 'text-xs'}>
                    {fila.etiqueta}
                  </span>
                  {!fila.destacado && (
                    <span className="block text-[10px] text-[var(--color-text-muted)] opacity-70">
                      {fila.descripcion}
                    </span>
                  )}
                </td>

                {/* Monto USD */}
                <td
                  className={[
                    'py-2 text-right tabular-nums',
                    fila.destacado
                      ? 'pt-3 font-bold text-[var(--color-accent)]'
                      : 'text-xs text-[var(--color-text)]',
                  ].join(' ')}
                  aria-label={`${fila.etiqueta} en dólares: ${formatearMonto(fila.montoUsd)}`}
                >
                  {formatearMonto(fila.montoUsd)}
                </td>

                {/* Monto PEN */}
                <td
                  className={[
                    'py-2 pl-3 text-right tabular-nums',
                    fila.destacado
                      ? 'pt-3 font-bold text-[var(--color-text)]'
                      : 'text-xs text-[var(--color-text-muted)]',
                  ].join(' ')}
                  aria-label={`${fila.etiqueta} en soles: ${formatearMonto(fila.montoPen, 'S/')}`}
                >
                  {formatearMonto(fila.montoPen, 'S/')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Nota de tipo de cambio */}
        <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">
          Tipo de cambio:{' '}
          <span className="font-medium tabular-nums">
            1 USD = S/{typeof tipoCambio === 'number' ? tipoCambio.toFixed(4) : '—'}
          </span>
        </p>
      </div>
    </section>
  );
}
