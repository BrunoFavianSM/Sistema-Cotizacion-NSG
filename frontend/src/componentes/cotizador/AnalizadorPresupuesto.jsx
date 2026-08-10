import { useState, useId, useMemo } from 'react';
import { formatearMoneda } from '../../utilidades/moneda';

/**
 * AnalizadorPresupuesto — Req. 11.1–11.10
 *
 * Permite al usuario ingresar un presupuesto máximo y compara en tiempo real
 * con el precio total de la configuración actual. Muestra exceso, confirmación
 * y recomendaciones de ahorro ordenadas por precio descendente.
 *
 * Props:
 *   precioTotalUsd   {number}  Precio total de la configuración en USD (con margen + IGV).
 *   precioTotalPen   {number}  Precio total en PEN.
 *   monedaVista      {string}  'USD' | 'PEN' — moneda activa del usuario.
 *   componentes      {Array}   Lista de componentes seleccionados con { nombre, precio_base }.
 *   tipoCambio       {number}  Tipo de cambio USD→PEN.
 */
export default function AnalizadorPresupuesto({
  precioTotalUsd = 0,
  precioTotalPen = 0,
  monedaVista = 'USD',
  componentes = [],
  tipoCambio = 1,
}) {
  const [valorPresupuesto, setValorPresupuesto] = useState('');
  const inputId = useId();
  const errorId = useId();
  const estadoId = useId();

  // ── Derivar precio total en la moneda activa ──────────────────────────────
  const precioTotal = monedaVista === 'USD' ? precioTotalUsd : precioTotalPen;
  const simbolo = monedaVista === 'USD' ? 'USD' : 'PEN';

  // ── Validar el valor ingresado ────────────────────────────────────────────
  const valorNumerico = parseFloat(valorPresupuesto);
  const hayValor = valorPresupuesto.trim() !== '';
  const esInvalido = hayValor && (isNaN(valorNumerico) || valorNumerico <= 0);
  const presupuesto = !esInvalido && hayValor ? valorNumerico : null;

  // ── Análisis de presupuesto (Req. 11.2, 11.3, 11.4) ──────────────────────
  const analisis = useMemo(() => {
    if (presupuesto === null) return null;
    const exceso = precioTotal - presupuesto;
    return {
      excedido: exceso > 0,
      exceso: exceso > 0 ? exceso : 0,
      diferencia: Math.abs(exceso),
    };
  }, [presupuesto, precioTotal]);

  // ── Recomendaciones de ahorro (Req. 11.5) ─────────────────────────────────
  // Componentes ordenados por precio_base descendente cuando hay exceso.
  const recomendaciones = useMemo(() => {
    if (!analisis?.excedido || componentes.length === 0) return [];
    return [...componentes]
      .filter((c) => c.precio_base != null)
      .sort((a, b) => parseFloat(b.precio_base) - parseFloat(a.precio_base))
      .slice(0, 3); // Mostrar los 3 más costosos
  }, [analisis, componentes]);

  // ── Formatear montos ──────────────────────────────────────────────────────
  const formatear = (montoUsd) => {
    if (monedaVista === 'USD') return formatearMoneda(montoUsd, 'USD');
    return formatearMoneda(montoUsd * tipoCambio, 'PEN');
  };

  // ── Mensaje de estado para aria-live ─────────────────────────────────────
  const mensajeEstado = useMemo(() => {
    if (!analisis) return '';
    if (analisis.excedido) {
      return `Presupuesto excedido por ${formatearMoneda(analisis.exceso, simbolo)}.`;
    }
    return `Dentro del presupuesto. Te sobran ${formatearMoneda(analisis.diferencia, simbolo)}.`;
  }, [analisis, simbolo]);

  return (
    <section
      className="surface-elevated p-5 space-y-4"
      aria-label="Analizador de presupuesto"
    >
      {/* Encabezado */}
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        Presupuesto
      </h3>

      {/* Campo de entrada (Req. 11.1, 11.7) */}
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
        >
          Presupuesto máximo ({simbolo})
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={valorPresupuesto}
          onChange={(e) => setValorPresupuesto(e.target.value)}
          placeholder={`Ej. ${monedaVista === 'USD' ? '1500' : '5500'}`}
          aria-invalid={esInvalido ? 'true' : 'false'}
          aria-describedby={`${esInvalido ? errorId : ''} ${estadoId}`.trim()}
          className={`min-h-11 w-full rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
            esInvalido
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--color-border)]'
          }`}
        />

        {/* Error de validación (Req. 11.8) */}
        {esInvalido && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
          >
            Ingresa un valor numérico positivo.
          </p>
        )}
      </div>

      {/* Región aria-live para anunciar cambios de estado (Req. 11.10) */}
      <div
        id={estadoId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {mensajeEstado}
      </div>

      {/* Resultado del análisis */}
      {analisis && (
        <div className="space-y-3">
          {analisis.excedido ? (
            /* ── Estado: excedido (Req. 11.3) ─────────────────────────────── */
            <div
              role="status"
              className="rounded-[var(--radius-sm)] border border-[color:rgba(255,69,58,0.35)] bg-[color:rgba(255,69,58,0.08)] p-3 space-y-1"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#FF453A]">
                Presupuesto excedido
              </p>
              <p className="text-sm text-[var(--color-text)]">
                Tu configuración supera el presupuesto por{' '}
                <span className="font-semibold" style={{ color: '#FF453A' }}>
                  {formatearMoneda(analisis.exceso, simbolo)}
                </span>
                .
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Total configuración:{' '}
                <span className="font-medium text-[var(--color-text)]">
                  {formatearMoneda(precioTotal, simbolo)}
                </span>
              </p>
            </div>
          ) : (
            /* ── Estado: dentro del presupuesto (Req. 11.4) ───────────────── */
            <div
              role="status"
              className="rounded-[var(--radius-sm)] border border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.08)] p-3 space-y-1"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#34C759]">
                Dentro del presupuesto
              </p>
              <p className="text-sm text-[var(--color-text)]">
                Tu configuración cabe en el presupuesto. Te sobran{' '}
                <span className="font-semibold" style={{ color: '#34C759' }}>
                  {formatearMoneda(analisis.diferencia, simbolo)}
                </span>
                .
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Total configuración:{' '}
                <span className="font-medium text-[var(--color-text)]">
                  {formatearMoneda(precioTotal, simbolo)}
                </span>
              </p>
            </div>
          )}

          {/* Recomendaciones de ahorro (Req. 11.5) */}
          {recomendaciones.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Componentes de mayor costo
              </p>
              <ul className="space-y-1.5" aria-label="Recomendaciones de ahorro">
                {recomendaciones.map((comp, i) => (
                  <li
                    key={`${comp.nombre}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2"
                  >
                    <span className="truncate text-xs text-[var(--color-text)]">
                      {comp.nombre}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
                      {formatear(parseFloat(comp.precio_base))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--color-text-muted)]">
                Considera reemplazar alguno de estos componentes para ajustarte al presupuesto.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío: sin configuración */}
      {!analisis && componentes.length === 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Selecciona componentes para analizar tu presupuesto.
        </p>
      )}
    </section>
  );
}
