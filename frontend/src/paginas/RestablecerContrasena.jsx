import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import ErrorState from '../componentes/feedback/ErrorState';
import { restablecerContrasena } from '../servicios/api';
import { evaluarFortalezaPassword } from '../utilidades/evaluarFortalezaPassword';

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);

  const fortaleza = evaluarFortalezaPassword(nuevaPassword);
  const contrasenasCoinciden = nuevaPassword === confirmarPassword;
  const mostrarAlertaCoincidencia = confirmarPassword.length > 0 && !contrasenasCoinciden;

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="surface-elevated p-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Enlace inválido</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            El enlace de recuperación no es válido o ha expirado.
          </p>
        </header>
        <div className="flex justify-center">
          <Link to="/recuperar" className="text-sm font-medium text-[var(--color-accent-text)] hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (nuevaPassword.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!/[A-Z]/.test(nuevaPassword)) return setError('Debe contener al menos una mayúscula.');
    if (!/[a-z]/.test(nuevaPassword)) return setError('Debe contener al menos una minúscula.');
    if (!/[0-9]/.test(nuevaPassword)) return setError('Debe contener al menos un número.');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword)) return setError('Debe contener al menos un carácter especial.');
    if (!contrasenasCoinciden) return setError('Las contraseñas no coinciden.');

    setCargando(true);

    try {
      const resultado = await restablecerContrasena({
        token,
        nuevaPassword,
        confirmarPassword
      });

      if (resultado?.exito) {
        setExitoso(true);
      } else {
        setError(resultado?.error || 'Error al restablecer la contraseña.');
      }
    } catch (err) {
      setError(err?.mensaje || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  if (exitoso) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="surface-elevated p-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Contraseña restablecida</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Tu contraseña ha sido actualizada exitosamente.
          </p>
        </header>
        <div className="flex justify-center">
          <Link
            to="/login"
            className="text-sm font-medium text-[var(--color-accent-text)] hover:underline"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Restablecer</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Nueva contraseña</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Ingresa tu nueva contraseña. Debe ser diferente a la anterior.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="restablecer-form-title"
      >
        <h2 id="restablecer-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          Elige tu nueva contraseña
        </h2>

        <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
          {error ? (
            <ErrorState title="Error" description={error} className="p-3" />
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="restablecer-password" className="text-sm font-medium text-[var(--color-text)]">
              Nueva contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>

            <div className="relative">
              <input
                id="restablecer-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={nuevaPassword}
                onChange={(e) => { setNuevaPassword(e.target.value); setError(''); }}
                className="w-full min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)]"
                placeholder="Mínimo 8 caracteres"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute inset-y-0 right-1 my-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                aria-pressed={mostrarPassword}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>

            {nuevaPassword.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-soft)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${fortaleza.porcentaje}%`, backgroundColor: fortaleza.color }} />
                </div>
                <p className="text-xs" style={{ color: fortaleza.color }}>{fortaleza.label}</p>
              </div>
            )}

            <p className="text-xs text-[var(--color-text-muted)]">
              Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="restablecer-confirmar" className="text-sm font-medium text-[var(--color-text)]">
              Confirmar contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>
            <input
              id="restablecer-confirmar"
              type="password"
              required
              autoComplete="new-password"
              value={confirmarPassword}
              onChange={(e) => { setConfirmarPassword(e.target.value); setError(''); }}
              className={`w-full min-h-11 rounded-[var(--radius-sm)] border px-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)] ${
                mostrarAlertaCoincidencia ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
              } bg-[var(--color-surface)]`}
              placeholder="Vuelve a ingresar la contraseña"
            />
            {mostrarAlertaCoincidencia && (
              <p className="text-xs text-[var(--color-danger)]">Las contraseñas no coinciden</p>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
              Restablecer contraseña
            </Button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}