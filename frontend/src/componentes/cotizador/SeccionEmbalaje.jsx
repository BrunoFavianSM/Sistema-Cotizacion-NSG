/**
 * SeccionEmbalaje
 *
 * Sección de configuración de embalaje para el cotizador.
 * Visible únicamente para el administrador autenticado.
 *
 * Requisitos: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8
 */

import { useState, useId } from 'react';
import { useAppContext } from '../../contexto/AppContext';

/**
 * @param {object}  props
 * @param {boolean} props.activo          - Si el embalaje está incluido en el cálculo
 * @param {string}  props.opcion          - "basico" | "avanzado"
 * @param {number}  props.precioBasico    - Precio editable opción básica (default $20)
 * @param {number}  props.precioAvanzado  - Precio editable opción avanzada (default $30)
 * @param {(activo: boolean) => void}              props.onToggle
 * @param {(opcion: string) => void}               props.onCambiarOpcion
 * @param {(campo: string, valor: number) => void} props.onCambiarPrecio
 */
export default function SeccionEmbalaje({
  activo,
  opcion,
  precioBasico,
  precioAvanzado,
  onToggle,
  onCambiarOpcion,
  onCambiarPrecio,
}) {
  const { autenticado } = useAppContext();

  // Estado local de los inputs (string) para permitir edición libre antes de validar
  const [inputBasico, setInputBasico] = useState(String(precioBasico));
  const [inputAvanzado, setInputAvanzado] = useState(String(precioAvanzado));
  const [errorBasico, setErrorBasico] = useState('');
  const [errorAvanzado, setErrorAvanzado] = useState('');

  // IDs únicos para accesibilidad
  const idToggle = useId();
  const idOpcionBasico = useId();
  const idOpcionAvanzado = useId();
  const idPrecioBasico = useId();
  const idPrecioAvanzado = useId();
  const idErrorBasico = useId();
  const idErrorAvanzado = useId();

  // Guard: solo visible para admin autenticado (Requisito 5.8)
  if (!autenticado) return null;

  // ── Validación de precio ──────────────────────────────────────────────────

  /**
   * Valida el valor ingresado. Si es válido llama onCambiarPrecio y limpia el
   * error; si no, muestra el mensaje y restaura el input al último valor válido.
   */
  function validarYConfirmar(campo, valorStr, ultimoValido, setInput, setError) {
    const num = parseFloat(valorStr);
    if (!valorStr.trim() || isNaN(num) || num <= 0) {
      setError('El precio debe ser un número mayor a 0');
      setInput(String(ultimoValido)); // restaurar último valor válido
    } else {
      setError('');
      onCambiarPrecio(campo, num);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleChangeBasico(e) {
    setInputBasico(e.target.value);
    // Limpiar error mientras el usuario escribe si el valor ya es válido
    const num = parseFloat(e.target.value);
    if (e.target.value.trim() && !isNaN(num) && num > 0) {
      setErrorBasico('');
    }
  }

  function handleBlurBasico() {
    validarYConfirmar('precioBasico', inputBasico, precioBasico, setInputBasico, setErrorBasico);
  }

  function handleChangeAvanzado(e) {
    setInputAvanzado(e.target.value);
    const num = parseFloat(e.target.value);
    if (e.target.value.trim() && !isNaN(num) && num > 0) {
      setErrorAvanzado('');
    }
  }

  function handleBlurAvanzado() {
    validarYConfirmar('precioAvanzado', inputAvanzado, precioAvanzado, setInputAvanzado, setErrorAvanzado);
  }

  // ── Clases reutilizables ──────────────────────────────────────────────────

  const claseOpcion = (esSeleccionada) =>
    [
      'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2',
      'text-sm font-medium transition-colors duration-higFast motion-reduce:transition-none',
      'focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-1',
      esSeleccionada
        ? 'bg-[var(--color-accent)] text-white shadow-sm'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
    ].join(' ');

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
      aria-labelledby="embalaje-titulo"
      className="surface-card overflow-hidden"
    >
      {/* Encabezado con toggle */}
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3">
        <span
          id="embalaje-titulo"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          Embalaje
        </span>

        {/* Toggle de activación — touch target 44px (Requisito 5.3) */}
        <label
          htmlFor={idToggle}
          className="relative inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-end"
          aria-label={activo ? 'Desactivar embalaje' : 'Activar embalaje'}
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
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-4">

          {/* Segmented control — opciones mutuamente excluyentes (Requisito 5.2) */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Tipo de embalaje
            </legend>
            <div
              role="radiogroup"
              aria-label="Tipo de embalaje"
              className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-secondary,var(--color-surface))] p-1"
            >
              {/* Opción Básico */}
              <label htmlFor={idOpcionBasico} className={claseOpcion(opcion === 'basico')}>
                <input
                  id={idOpcionBasico}
                  type="radio"
                  name="embalaje-opcion"
                  value="basico"
                  checked={opcion === 'basico'}
                  onChange={() => onCambiarOpcion('basico')}
                  className="sr-only"
                />
                Básico
              </label>

              {/* Opción Avanzado */}
              <label htmlFor={idOpcionAvanzado} className={claseOpcion(opcion === 'avanzado')}>
                <input
                  id={idOpcionAvanzado}
                  type="radio"
                  name="embalaje-opcion"
                  value="avanzado"
                  checked={opcion === 'avanzado'}
                  onChange={() => onCambiarOpcion('avanzado')}
                  className="sr-only"
                />
                Avanzado
              </label>
            </div>
          </fieldset>

          {/* Campos de precio editables (Requisito 5.6, 5.7) */}
          <div className="space-y-3">
            {/* Precio Básico */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={idPrecioBasico}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Precio Básico (USD)
                </label>
                {errorBasico && (
                  <p
                    id={idErrorBasico}
                    role="alert"
                    className="text-xs text-[var(--color-danger)]"
                  >
                    {errorBasico}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">$</span>
                <input
                  id={idPrecioBasico}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={inputBasico}
                  onChange={handleChangeBasico}
                  onBlur={handleBlurBasico}
                  aria-invalid={!!errorBasico}
                  aria-describedby={errorBasico ? idErrorBasico : undefined}
                  aria-label="Precio embalaje básico en dólares"
                  className={claseInput(!!errorBasico)}
                />
              </div>
            </div>

            {/* Precio Avanzado */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={idPrecioAvanzado}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Precio Avanzado (USD)
                </label>
                {errorAvanzado && (
                  <p
                    id={idErrorAvanzado}
                    role="alert"
                    className="text-xs text-[var(--color-danger)]"
                  >
                    {errorAvanzado}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">$</span>
                <input
                  id={idPrecioAvanzado}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={inputAvanzado}
                  onChange={handleChangeAvanzado}
                  onBlur={handleBlurAvanzado}
                  aria-invalid={!!errorAvanzado}
                  aria-describedby={errorAvanzado ? idErrorAvanzado : undefined}
                  aria-label="Precio embalaje avanzado en dólares"
                  className={claseInput(!!errorAvanzado)}
                />
              </div>
            </div>
          </div>

          {/* Resumen del precio seleccionado */}
          <p className="text-xs text-[var(--color-text-muted)]">
            Precio activo:{' '}
            <span className="font-semibold text-[var(--color-accent)]">
              ${opcion === 'basico' ? precioBasico.toFixed(2) : precioAvanzado.toFixed(2)} USD
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
