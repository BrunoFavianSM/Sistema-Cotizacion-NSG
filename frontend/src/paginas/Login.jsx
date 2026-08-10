import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import ErrorState from '../componentes/feedback/ErrorState';
import TurnstileWidget from '../componentes/ui/TurnstileWidget';
import { useAppContext } from '../contexto/AppContext';

function validarCredenciales(correo, password) {
  if (!correo.trim()) {
    return 'El correo es obligatorio.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    return 'Ingresa un correo válido.';
  }
  if (!password) {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return '';
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppContext();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const validacion = validarCredenciales(correo, password);
    if (validacion) {
      setError(validacion);
      return;
    }

    setCargando(true);

    try {
      const resultado = await login(correo.trim().toLowerCase(), password, captchaToken);

      if (resultado?.exito) {
        navigate(resultado.rol === 'admin' ? '/admin/productos' : '/cotizador');
        return;
      }

      setError(resultado?.error || 'No se pudo iniciar sesión con esas credenciales.');
    } catch (err) {
      setError(err?.mensaje || 'No se pudo iniciar sesión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Acceso</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Iniciar sesión</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Ingresa con tu cuenta para ver precios, crear cotizaciones y acceder al asistente de configuración.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="login-form-title"
      >
        <h2 id="login-form-title" className="text-lg font-semibold text-[var(--color-text)]">Credenciales de acceso</h2>

        <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
          {error ? (
            <ErrorState
              title="No se pudo iniciar sesión"
              description={error}
              className="p-3"
            />
          ) : null}

          <InputField
            id="login-correo"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(event) => {
              setCorreo(event.target.value);
              setError('');
            }}
            placeholder="nombre@correo.com"
          />

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-[var(--color-text)]">
              Contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>

            <div className="relative">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                className="w-full min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)]"
                placeholder="Ingresa tu contraseña"
                aria-required="true"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute inset-y-0 right-1 my-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                aria-pressed={mostrarPassword}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">Por seguridad, usa una contraseña de al menos 8 caracteres.</p>
          </div>

          <TurnstileWidget onToken={setCaptchaToken} />

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
              Iniciar sesión
            </Button>
            <p className="text-sm text-[var(--color-text-muted)]">
              <Link to="/recuperar" className="font-medium text-[var(--color-accent-text)] hover:underline">
                Recuperar contraseña
              </Link>
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="font-medium text-[var(--color-accent-text)] hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
