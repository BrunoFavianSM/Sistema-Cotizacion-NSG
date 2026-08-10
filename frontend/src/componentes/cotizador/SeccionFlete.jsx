/**
 * SeccionFlete
 *
 * Sección de configuración de flete (transportista) para el cotizador.
 * Visible únicamente para el administrador autenticado.
 *
 * Requisitos: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8
 */

import { useState, useId } from 'react';
import { useAppContext } from '../../contexto/AppContext';

/**
 * @param {object}  props
 * @param {boolean} props.activo          - Si el flete está incluido en el cálculo
 * @param {number}  props.precio          - Precio editable (default $20)
 * @param {(activo: boolean) => void}  props.onToggle
 * @param {(valor: number) => void}    props.onCambiarPrecio
 */
export default function SeccionFlete({ activo, precio, onToggle, onCambiarPrecio }) {
  const { autenticado } = useAppContext();

  // Estado local del input (string) para permitir edición libre antes de validar
  const [inputPrecio, setInputPrecio] = useState(String(precio));
  const [errorPrecio, setErrorPrecio] = useState('');

  // IDs únicos para accesibilidad
  const idToggle = useId();
  const idPrecio = useId();
  const idError = useId();

  // Guard: solo visible para admin autenticado (Requisito 6.8)
  if (!autenticado) return null;

  // ── Validación de precio ──────────────────────────────────────────────────

  /**
   * Valida el valor ingresado. Si es válido llama onCambiarPrecio y limpia el
   * error; si no, muestra el mensaje y restaura el input al último valor válido.
   */
  function validarYConfirmar(valorStr) {
    const num = parseFloat(valorStr);
    if (!valorStr.trim() || isNaN(num) || num <= 0) {
      setErrorPrecio('El precio debe ser un número mayor a 0');
      setInputPrecio(String(precio)); // restaurar último valor válido
    } else {
      setErrorPrecio('');
      onCambiarPrecio(num);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleChange(e) {
    setInputPrecio(e.target.value);
    // Limpiar error mientras el usuario escribe si el valor ya es válido
    const num = parseFloat(e.target.value);
    if (e.target.value.trim() && !isNaN(num) && num > 0) {
      setErrorPrecio('');
    }
  }

  function handleBlur() {
    validarYConfirmar(inputPrecio);
  }

  // ── Clases reutilizables ──────────────────────────────────────────────────

  const claseInput = (hayError) =>
    [
      'w-20 rounded-[var(--radius-sm)] border px-2 py-1 text-sm tabular-nums',
      'bg-[var(--color-surface)] text-[var(--color-text)]',
      'transition-colors duration-higFast motion-reduce:transition-none',
      'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1',
      hayError
        ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
        : 'border-[var(--color-border)]',
    ].join(' ');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      aria-labelledby="flete-titulo"
      className="surface-card overflow-hidden"
    >
      {/* Encabezado con toggle */}
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3">
        <span
          id="flete-titulo"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          Flete (Transportista)
        </span>

        {/* Toggle de activación — touch target 44px (Requisito 6.3) */}
        <label
          htmlFor={idToggle}
          className="relative inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-end"
          aria-label={activo ? 'Desactivar flete' : 'Activar flete'}
        >
          <input
            id={idToggle}
            type="checkbox"
            role="switch"
            checked={activo}
            onChange={(e) => onToggle(e.target.checked)}
            aria-checked={activo}
            className="sr-only"
          />
          {/* Pista del switch */}
          <span
            aria-hidden="true"
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full',
              'transition-colors duration-higNormal motion-reduce:transition-none',
              activo ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]',
            ].join(' ')}
          >
            {/* Pulgar del switch */}
            <span
              className={[
                'inline-block h-4 w-4 rounded-full bg-white shadow',
                'transition-transform duration-higNormal motion-reduce:transition-none',
                activo ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </span>
        </label>
      </div>

      {/* Contenido expandido cuando está activo */}
      {activo && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-3">

          {/* Campo de precio editable (Requisito 6.6, 6.7) */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={idPrecio}
                className="text-sm text-[var(--color-text-muted)]"
              >
                Precio Flete (USD)
              </label>
              {errorPrecio && (
                <p
                  id={idError}
                  role="alert"
                  className="text-xs text-[var(--color-danger)]"
                >
                  {errorPrecio}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--color-text-muted)]">$</span>
              <input
                id={idPrecio}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={inputPrecio}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errorPrecio}
                aria-describedby={errorPrecio ? idError : undefined}
                aria-label="Precio de flete en dólares"
                className={claseInput(!!errorPrecio)}
              />
            </div>
          </div>

          {/* Resumen del precio activo */}
          <p className="text-xs text-[var(--color-text-muted)]">
            Precio activo:{' '}
            <span className="font-semibold text-[var(--color-accent)]">
              ${precio.toFixed(2)} USD
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
