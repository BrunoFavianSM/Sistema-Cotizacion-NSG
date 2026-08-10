/**
 * BalanceFinal — Resumen financiero de ganancia global para el admin.
 *
 * Muestra costo neto total, precio de venta (sin IGV), monto de ganancia
 * y porcentaje de ganancia calculado sobre todos los productos seleccionados
 * (componentes principales + extras).
 *
 * Solo se renderiza cuando esAdmin === true (el control está en Cotizador.jsx).
 *
 * Requisitos: 3.1 – 3.10
 */

import { useMemo } from 'react';

/**
 * @param {Object}   props
 * @param {Array}    props.productosSeleccionados  - [{ precio_base, cantidad }] componentes principales
 * @param {Object}   props.extras                  - { [categoria]: [{ producto: { precio_base }, cantidad }] }
 * @param {number}   props.margenGanancia           - 0-100, del AppContext
 * @param {string}   props.monedaVista              - para formatear montos
 * @param {Function} props.formatearMontoSegunMonedaVista - función del AppContext
 */
export default function BalanceFinal({
  productosSeleccionados = [],
  extras = {},
  margenGanancia = 0,
  monedaVista,
  formatearMontoSegunMonedaVista,
}) {
  const { costoNeto, precioVenta, ganancia, porcentajeGanancia } = useMemo(() => {
    // Costo neto: suma de precio_base × cantidad de todos los productos
    let costo = 0;

    // Componentes principales
    for (const item of productosSeleccionados) {
      const precio = parseFloat(item?.precio_base ?? 0);
      const cantidad = Number(item?.cantidad ?? 1);
      if (!isNaN(precio) && !isNaN(cantidad)) {
        costo += precio * cantidad;
      }
    }

    // Extras: { categoria: [{ producto: { precio_base }, cantidad }] }
    for (const items of Object.values(extras)) {
      for (const { producto, cantidad } of items) {
        const precio = parseFloat(producto?.precio_base ?? 0);
        const cant = Number(cantidad ?? 1);
        if (!isNaN(precio) && !isNaN(cant)) {
          costo += precio * cant;
        }
      }
    }

    const margen = Number(margenGanancia ?? 0);
    const venta = costo * (1 + margen / 100);
    const gan = venta - costo;

    // Porcentaje de ganancia: ((venta - costo) / costo) × 100, redondeado a 2 decimales
    const pct = costo > 0
      ? Math.round(((venta - costo) / costo) * 100 * 100) / 100
      : 0;

    return {
      costoNeto: costo,
      precioVenta: venta,
      ganancia: gan,
      porcentajeGanancia: pct,
    };
  }, [productosSeleccionados, extras, margenGanancia]);

  // Color del porcentaje según Req. 3.6 y 3.7
  const colorPorcentaje =
    porcentajeGanancia > 0
      ? '#34C759'
      : 'var(--color-text-muted)';

  const fmt = (montoUsd) =>
    formatearMontoSegunMonedaVista
      ? formatearMontoSegunMonedaVista({ montoUsd })
      : `$${montoUsd.toFixed(2)}`;

  return (
    <section
      className="surface-elevated space-y-3 p-5"
      aria-label="Balance financiero de la configuración"
      aria-live="polite"
    >
      {/* Encabezado */}
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        Balance final
      </h3>

      {/* Filas de datos */}
      <dl className="space-y-2">
        {/* Costo neto total */}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[var(--color-text-muted)]">Costo neto</dt>
          <dd className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
            {fmt(costoNeto)}
          </dd>
        </div>

        {/* Precio de venta (sin IGV) */}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[var(--color-text-muted)]">Precio de venta (sin IGV)</dt>
          <dd className="text-sm font-semibold tabular-nums text-[var(--color-accent-text)]">
            {fmt(precioVenta)}
          </dd>
        </div>

        {/* Separador */}
        <div
          className="border-t border-[var(--color-border)]"
          role="separator"
          aria-hidden="true"
        />

        {/* Monto de ganancia */}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[var(--color-text-muted)]">Ganancia</dt>
          <dd className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
            {fmt(ganancia)}
          </dd>
        </div>

        {/* Porcentaje de ganancia */}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-[var(--color-text-muted)]">% Ganancia</dt>
          <dd
            className="text-base font-bold tabular-nums"
            style={{ color: colorPorcentaje }}
            aria-label={`Porcentaje de ganancia: ${porcentajeGanancia}%`}
          >
            {porcentajeGanancia.toFixed(2)}%
          </dd>
        </div>
      </dl>
    </section>
  );
}
