/**
 * ConfiguracionPropuesta.jsx
 *
 * Tarjeta que muestra la configuración de PC propuesta por el asistente.
 * - Lista de componentes con precios en PEN (S/ X,XXX.XX)
 * - Icono de validación exitosa cuando validada = true
 * - Sección de advertencias (productos a pedido) con estilo warning
 * - Botón "Aplicar configuración" que llama onAplicar()
 *
 * Requisitos: 3.8, 4.1, 4.5, 11.2, 12.2
 */

// Icono checkmark.circle.fill — SF Symbol equivalente
const IconoValidado = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-[var(--color-success)] stroke-2"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Icono de advertencia
const IconoAdvertencia = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-[var(--color-warning)] stroke-2 flex-shrink-0"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

/**
 * Formatea un número como precio en soles peruanos
 * Ejemplo: 1234.5 → "S/ 1,234.50"
 */
function formatearPrecioPEN(monto) {
  if (monto == null || isNaN(monto)) return '—';
  return `S/ ${Number(monto).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Etiquetas legibles para cada campo de componente
const etiquetasComponente = {
  procesador: 'Procesador',
  placa_madre: 'Placa Madre',
  ram: 'Memoria RAM',
  almacenamiento: 'Almacenamiento',
  gpu: 'Tarjeta Gráfica',
  fuente: 'Fuente de Poder',
  case: 'Gabinete',
};

const ORDEN_COMPONENTES = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];

/**
 * Fila de un componente individual
 */
function FilaComponente({ etiqueta, nombre, precioPen, aPedido }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          {etiqueta}
        </span>
        <span className="text-sm text-[var(--color-text)] leading-snug mt-0.5">
          {nombre}
          {aPedido && (
            <span className="ml-1.5 text-[10px] font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-1.5 py-0.5 rounded-full">
              A pedido
            </span>
          )}
        </span>
      </div>
      <span className="text-sm font-semibold text-[var(--color-text)] flex-shrink-0 tabular-nums">
        {formatearPrecioPEN(precioPen)}
      </span>
    </div>
  );
}

/**
 * Componente principal de configuración propuesta
 *
 * Props:
 * - configuracion: objeto con procesador, placa_madre, ram[], almacenamiento, gpu, fuente, case,
 *                  precio_total_pen, validada
 * - advertencias: string[] — lista de advertencias (ej: productos a pedido)
 * - onAplicar: () => void — callback al presionar "Aplicar configuración"
 */
export default function ConfiguracionPropuesta({
  configuracion = {},
  advertencias = [],
  onAplicar,
}) {
  if (!configuracion || Object.keys(configuracion).length === 0) return null;

  const { precio_total_pen, validada } = configuracion;

  return (
    <section
      aria-label="Configuración de PC propuesta"
      className={[
        'rounded-[14px] border border-[var(--color-border)]',
        'bg-[var(--color-surface)]',
        'overflow-hidden',
        'shadow-[var(--shadow-1)]',
      ].join(' ')}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          Configuración propuesta
        </span>
        {validada && (
          <div className="flex items-center gap-1.5" aria-label="Configuración validada">
            <IconoValidado />
            <span className="text-xs font-medium text-[var(--color-success)]">
              Validada
            </span>
          </div>
        )}
      </div>

      {/* Lista de componentes */}
      <div className="px-4 py-2">
        {ORDEN_COMPONENTES.map((clave) => {
          const componente = configuracion[clave];
          if (!componente) return null;

          // RAM puede ser un array
          if (clave === 'ram' && Array.isArray(componente)) {
            return componente.map((modulo, idx) => (
              <FilaComponente
                key={`ram-${idx}`}
                etiqueta={idx === 0 ? etiquetasComponente.ram : `RAM ${idx + 1}`}
                nombre={modulo.nombre || '—'}
                precioPen={modulo.precio_pen}
                aPedido={modulo.disponible_a_pedido && !modulo.stock}
              />
            ));
          }

          return (
            <FilaComponente
              key={clave}
              etiqueta={etiquetasComponente[clave] || clave}
              nombre={componente.nombre || '—'}
              precioPen={componente.precio_pen}
              aPedido={componente.disponible_a_pedido && !componente.stock}
            />
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">Total</span>
        <span className="text-base font-bold text-[var(--color-text)] tabular-nums">
          {formatearPrecioPEN(precio_total_pen)}
        </span>
      </div>

      {/* Advertencias (productos a pedido u otras) */}
      {advertencias.length > 0 && (
        <div
          role="alert"
          aria-label="Advertencias de la configuración"
          className="mx-4 mb-3 mt-1 rounded-[10px] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-3 py-2.5"
        >
          <div className="flex items-start gap-2">
            <IconoAdvertencia />
            <div className="flex flex-col gap-1">
              {advertencias.map((advertencia, idx) => (
                <p key={idx} className="text-xs text-[var(--color-warning)] leading-snug">
                  {advertencia}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botón de acción */}
      <div className="px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={onAplicar}
          aria-label="Aplicar esta configuración al cotizador"
          className={[
            'w-full min-h-[44px] px-4 py-2.5 rounded-[12px]',
            'bg-[var(--color-accent)] text-white font-semibold text-sm',
            'hover:opacity-90 active:opacity-80',
            'transition-opacity duration-150',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2',
            'focus-visible:ring-offset-[var(--color-surface)]',
          ].join(' ')}
        >
          Aplicar configuración
        </button>
      </div>
    </section>
  );
}
