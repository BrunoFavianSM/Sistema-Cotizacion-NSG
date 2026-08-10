/**
 * Dashboard de Métricas Rápidas — Página de administración
 *
 * Muestra métricas operativas del negocio: cotizaciones del día y la semana,
 * ingresos estimados y los 5 productos más cotizados en un gráfico de barras.
 *
 * Valida Requisitos: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import Button from '../componentes/ui/Button';
import { useAppContext } from '../contexto/AppContext';
import { obtenerMetricasDashboard } from '../servicios/api';
import { formatearMoneda } from '../utilidades/moneda';

// ─── Stat Card ────────────────────────────────────────────────────────────────

/**
 * Tarjeta de métrica individual.
 * @param {{ label: string, value: string, sublabel?: string, tone?: 'neutral'|'accent'|'success'|'warning' }} props
 */
function StatCard({ label, value, sublabel, tone = 'neutral' }) {
  const toneStyles = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-surface-soft)]',
    accent:
      'border-[color:rgba(0,94,203,0.35)] bg-[var(--color-accent-soft)] dark:border-[color:rgba(11,99,206,0.45)]',
    success:
      'border-[color:rgba(31,127,59,0.35)] bg-[color:rgba(31,127,59,0.10)] dark:border-[color:rgba(114,226,160,0.35)] dark:bg-[color:rgba(114,226,160,0.10)]',
    warning:
      'border-[color:rgba(140,82,0,0.35)] bg-[color:rgba(140,82,0,0.10)] dark:border-[color:rgba(255,215,130,0.35)] dark:bg-[color:rgba(255,215,130,0.10)]',
  };

  return (
    <article
      className={`rounded-[var(--radius-md)] border p-5 ${toneStyles[tone] ?? toneStyles.neutral}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
      {sublabel ? (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{sublabel}</p>
      ) : null}
    </article>
  );
}

// ─── Tooltip personalizado para Recharts ──────────────────────────────────────

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-2)]"
      role="tooltip"
    >
      <p className="text-xs font-semibold text-[var(--color-text)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--color-accent-text)]">
        {payload[0].value} cotizaciones
      </p>
    </div>
  );
}

// ─── Gráfico de barras ────────────────────────────────────────────────────────

/**
 * Gráfico de barras con los 5 productos más cotizados.
 * Usa colores del sistema de diseño y respeta dark mode vía CSS variables.
 */
function GraficoProductosTop({ datos }) {
  // Colores de acento para las barras (escala de opacidad del accent)
  const COLORES = [
    'var(--color-accent)',
    'rgba(0,94,203,0.80)',
    'rgba(0,94,203,0.65)',
    'rgba(0,94,203,0.50)',
    'rgba(0,94,203,0.38)',
  ];

  if (!datos?.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        Sin datos de productos para el período.
      </p>
    );
  }

  // Truncar nombres largos para el eje X
  const datosFormateados = datos.map((d) => ({
    ...d,
    nombre_corto:
      d.nombre_producto.length > 22
        ? `${d.nombre_producto.slice(0, 20)}…`
        : d.nombre_producto,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={datosFormateados}
        margin={{ top: 8, right: 8, left: -16, bottom: 48 }}
        aria-label="Gráfico de barras: 5 productos más cotizados en los últimos 7 días"
        role="img"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="nombre_corto"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          tickLine={false}
          axisLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: 'var(--color-surface-soft)' }} />
        <Bar dataKey="apariciones" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {datosFormateados.map((_, index) => (
            <Cell key={`celda-${index}`} fill={COLORES[index % COLORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { monedaVista } = useAppContext();
  const moneda = monedaVista || 'USD';

  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarMetricas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerMetricasDashboard();
      setMetricas(datos);
    } catch (err) {
      setError(err?.mensaje || 'No se pudieron cargar las métricas. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // ── Helpers de formato ──────────────────────────────────────────────────────

  const formatNum = (n) => Number(n ?? 0).toLocaleString('es-PE');
  const formatDinero = (n) => formatearMoneda(Number(n ?? 0), moneda);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administración"
        title="Dashboard"
        description="Métricas operativas del negocio en tiempo real."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={cargarMetricas}
            disabled={cargando}
            aria-label="Actualizar métricas del dashboard"
          >
            Actualizar
          </Button>
        }
      />

      {/* Estado de carga */}
      {cargando && (
        <div
          className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
          aria-busy="true"
          aria-live="polite"
          aria-label="Cargando métricas del dashboard"
        >
          <LoadingSpinner label="Cargando métricas…" size="lg" />
        </div>
      )}

      {/* Estado de error */}
      {!cargando && error && (
        <ErrorState
          title="No se pudieron cargar las métricas"
          description={error}
          retryLabel="Reintentar"
          onRetry={cargarMetricas}
        />
      )}

      {/* Contenido principal */}
      {!cargando && !error && metricas && (
        <>
          {/* Stat cards — 2×2 en móvil, 4 columnas en desktop */}
          <section aria-label="Resumen de métricas">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Cotizaciones hoy"
                value={formatNum(metricas.hoy?.total)}
                sublabel="Pendientes y completadas"
                tone="neutral"
              />
              <StatCard
                label="Cotizaciones semana"
                value={formatNum(metricas.semana?.total)}
                sublabel="Últimos 7 días"
                tone="neutral"
              />
              <StatCard
                label="Ingresos estimados hoy"
                value={formatDinero(metricas.hoy?.ingresos)}
                sublabel="Cotizaciones activas"
                tone="accent"
              />
              <StatCard
                label="Ingresos estimados semana"
                value={formatDinero(metricas.semana?.ingresos)}
                sublabel="Últimos 7 días"
                tone="success"
              />
            </div>
          </section>

          {/* Gráfico de productos más cotizados */}
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            aria-label="Productos más cotizados"
          >
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Productos más cotizados
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Top 5 en los últimos 7 días
            </p>
            <div className="mt-6">
              <GraficoProductosTop datos={metricas.productosTop} />
            </div>

            {/* Tabla de respaldo accesible */}
            {metricas.productosTop?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm" aria-label="Tabla de productos más cotizados">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th
                        scope="col"
                        className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                      >
                        Producto
                      </th>
                      <th
                        scope="col"
                        className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                      >
                        Categoría
                      </th>
                      <th
                        scope="col"
                        className="pb-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                      >
                        Apariciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.productosTop.map((producto, idx) => (
                      <tr
                        key={`${producto.nombre_producto}-${idx}`}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="py-2.5 pr-4 text-[var(--color-text)]">
                          {producto.nombre_producto}
                        </td>
                        <td className="py-2.5 pr-4 text-[var(--color-text-muted)]">
                          {producto.categoria}
                        </td>
                        <td className="py-2.5 text-right font-medium tabular-nums text-[var(--color-text)]">
                          {formatNum(producto.apariciones)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
