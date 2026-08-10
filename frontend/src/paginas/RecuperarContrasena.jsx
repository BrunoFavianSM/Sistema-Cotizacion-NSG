import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import { solicitarRecuperacion, solicitarRecuperacionPorTelefono } from '../servicios/api';

// ─── Constantes ──────────────────────────────────────────────────────────────

const METODOS = /** @type {const} */ ({
  CORREO: 'correo',
  TELEFONO: 'telefono',
});

// ─── Componente ──────────────────────────────────────────────────────────────

export default function RecuperarContrasena() {
  // Estado de método activo: 'correo' | 'telefono'
  const [metodo, setMetodo] = useState(METODOS.CORREO);

  // Campos de formulario
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estado de UI
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // ── Cambio de método ────────────────────────────────────────────────────────
  const cambiarMetodo = (nuevoMetodo) => {
    if (nuevoMetodo === metodo) return;
    setMetodo(nuevoMetodo);
    setError('');
    setEnviado(false);
    setMensajeExito('');
  };

  // ── Submit correo ───────────────────────────────────────────────────────────
  const manejarSubmitCorreo = async (event) => {
    event.preventDefault();
    setError('');

    if (!correo.trim()) return setError('El correo electrónico es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
      return setError('El formato del correo no es válido.');

    setCargando(true);
    try {
      const resultado = await solicitarRecuperacion(correo.trim().toLowerCase());
      if (resultado?.exito) {
        setMensajeExito(resultado.mensaje || 'Correo enviado. Revisa tu bandeja de entrada.');
        setEnviado(true);
      } else {
        setError(resultado?.mensaje || 'Cuenta no encontrada.');
      }
    } catch (err) {
      setError(err?.mensaje || 'Cuenta no encontrada.');
    } finally {
      setCargando(false);
    }
  };

  // ── Submit teléfono ─────────────────────────────────────────────────────────
  const manejarSubmitTelefono = async (event) => {
    event.preventDefault();
    setError('');

    const telefonoLimpio = telefono.trim().replace(/\s/g, '');
    if (!telefonoLimpio) return setError('El número de teléfono es obligatorio.');
    if (!/^\d{7,15}$/.test(telefonoLimpio))
      return setError('El número debe contener entre 7 y 15 dígitos.');

    setCargando(true);
    try {
      const resultado = await solicitarRecuperacionPorTelefono(telefonoLimpio);
      if (resultado?.exito) {
        setMensajeExito(resultado.mensaje || 'Correo enviado. Revisa la bandeja de entrada asociada a este número.');
        setEnviado(true);
      } else {
        setError(resultado?.mensaje || 'Cuenta no encontrada.');
      }
    } catch (err) {
      setError(err?.mensaje || 'Cuenta no encontrada.');
    } finally {
      setCargando(false);
    }
  };


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      {/* Encabezado */}
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Recuperación
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
          Recuperar contraseña
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Elige cómo quieres recibir las instrucciones para restablecer tu contraseña.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="recuperar-form-title"
      >
        <h2
          id="recuperar-form-title"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          {enviado ? 'Solicitud enviada' : 'Selecciona un método'}
        </h2>

        {enviado ? (
          /* ── Estado: confirmación enviada ─────────────────────────────── */
          <div className="mt-4 space-y-4">
            <div
              role="status"
              aria-live="polite"
              className="rounded-[var(--radius-sm)] bg-[color:rgba(48,209,88,0.10)] p-4 text-sm text-[var(--color-success)]"
            >
              {mensajeExito}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Revisa tu bandeja de entrada y carpeta de spam. El enlace expira en 5 minutos.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          /* ── Estado: formulario ───────────────────────────────────────── */
          <div className="mt-4 space-y-5">
            {/* Selector de método — touch target mínimo 44px (Req. 1.6, WCAG AA) */}
            <div
              role="group"
              aria-label="Método de recuperación"
              className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 gap-1"
            >
              <button
                type="button"
                onClick={() => cambiarMetodo(METODOS.CORREO)}
                aria-pressed={metodo === METODOS.CORREO}
                className={[
                  'flex-1 min-h-[44px] rounded-[calc(var(--radius-sm)-2px)] px-3 py-2',
                  'text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  metodo === METODOS.CORREO
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
                ].join(' ')}
              >
                Correo electrónico
              </button>

              <button
                type="button"
                onClick={() => cambiarMetodo(METODOS.TELEFONO)}
                aria-pressed={metodo === METODOS.TELEFONO}
                className={[
                  'flex-1 min-h-[44px] rounded-[calc(var(--radius-sm)-2px)] px-3 py-2',
                  'text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  metodo === METODOS.TELEFONO
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
                ].join(' ')}
              >
                Número de teléfono
              </button>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-sm)] bg-[color:rgba(255,69,58,0.10)] p-3 text-sm text-[var(--color-danger)]"
              >
                {error}
              </div>
            )}

            {/* ── Formulario: correo ─────────────────────────────────────── */}
            {metodo === METODOS.CORREO && (
              <form onSubmit={manejarSubmitCorreo} className="space-y-4" noValidate>
                <InputField
                  id="recuperar-correo"
                  label="Correo electrónico"
                  type="email"
                  required
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    setError('');
                  }}
                  placeholder="nombre@correo.com"
                />

                <div className="flex flex-col items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    loading={cargando}
                    className="sm:min-w-[12rem]"
                  >
                    Enviar instrucciones
                  </Button>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    ¿Recordaste tu contraseña?{' '}
                    <Link
                      to="/login"
                      className="font-medium text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* ── Formulario: teléfono (Req. 1.8) ───────────────────────── */}
            {metodo === METODOS.TELEFONO && (
              <form onSubmit={manejarSubmitTelefono} className="space-y-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="recuperar-telefono"
                    className="text-sm font-medium text-[var(--color-text)]"
                  >
                    Número de teléfono
                  </label>
                  <input
                    id="recuperar-telefono"
                    type="tel"
                    autoComplete="tel"
                    aria-label="Número de teléfono"
                    aria-describedby="recuperar-telefono-hint"
                    required
                    value={telefono}
                    onChange={(e) => {
                      setTelefono(e.target.value);
                      setError('');
                    }}
                    placeholder="Ej: 987654321"
                    className={[
                      'w-full min-h-[44px] rounded-[var(--radius-sm)] border px-3 py-2',
                      'bg-[var(--color-surface)] text-[var(--color-text)]',
                      'placeholder:text-[var(--color-text-muted)]',
                      'transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
                      error
                        ? 'border-[var(--color-danger)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                    ].join(' ')}
                  />
                  <p
                    id="recuperar-telefono-hint"
                    className="text-xs text-[var(--color-text-muted)]"
                  >
                    Solo dígitos, entre 7 y 15 caracteres.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    loading={cargando}
                    className="sm:min-w-[12rem]"
                  >
                    Enviar instrucciones
                  </Button>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    ¿Recordaste tu contraseña?{' '}
                    <Link
                      to="/login"
                      className="font-medium text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}
