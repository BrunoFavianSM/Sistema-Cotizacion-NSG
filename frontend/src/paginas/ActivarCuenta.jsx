import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import ErrorState from '../componentes/feedback/ErrorState';
import { useAppContext } from '../contexto/AppContext';
import { activarCuenta } from '../servicios/api';
import { evaluarFortalezaPassword } from '../utilidades/evaluarFortalezaPassword';

const REGLAS_PASSWORD = [
  { test: (p) => p.length >= 8, msg: 'La contraseña debe tener al menos 8 caracteres.' },
  { test: (p) => /[A-Z]/.test(p), msg: 'Debe contener al menos una mayúscula.' },
  { test: (p) => /[a-z]/.test(p), msg: 'Debe contener al menos una minúscula.' },
  { test: (p) => /[0-9]/.test(p), msg: 'Debe contener al menos un número.' },
  { test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), msg: 'Debe contener al menos un carácter especial.' },
];

export default function ActivarCuenta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verificarAutenticacion } = useAppContext();

  const [correo, setCorreo] = useState(searchParams.get('correo') || '');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const fortaleza = evaluarFortalezaPassword(password);
  const coinciden = password.length > 0 && password === confirmar;

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!correo.trim()) return setError('El correo es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setError('Ingresa un correo válido.');
    const reglaFallida = REGLAS_PASSWORD.find((r) => !r.test(password));
    if (reglaFallida) return setError(reglaFallida.msg);
    if (!coinciden) return setError('Las contraseñas no coinciden.');

    setCargando(true);
    try {
      const resultado = await activarCuenta({
        correo: correo.trim().toLowerCase(),
        password,
        confirmarPassword: confirmar,
      });
      if (resultado?.exito) {
        // activarCuenta guarda token/usuario; refrescamos el contexto y entramos.
        if (typeof verificarAutenticacion === 'function') {
          await verificarAutenticacion();
        }
        navigate('/cotizador');
        return;
      }
      setError(resultado?.error || resultado?.mensaje || 'No se pudo activar la cuenta.');
    } catch (err) {
      setError(err?.error || err?.mensaje || 'No se pudo activar la cuenta. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Activar cuenta</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Activa tu cuenta</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Tu correo ya tiene cotizaciones asociadas. Define una contraseña para acceder a tu cuenta y tu historial.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="activar-form-title"
      >
        <h2 id="activar-form-title" className="text-lg font-semibold text-[var(--color-text)]">Datos de activación</h2>

        <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
          {error ? (
            <ErrorState title="No se pudo activar" description={error} className="p-3" />
          ) : null}

          <InputField
            id="activar-correo"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(''); }}
            placeholder="tucorreo@dominio.com"
          />

          <div>
            <InputField
              id="activar-password"
              label="Nueva contraseña"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              hint="Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial."
            />
            {password ? (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div className="h-full transition-all" style={{ width: `${fortaleza.porcentaje}%`, backgroundColor: fortaleza.color }} />
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Seguridad: {fortaleza.label}</p>
              </div>
            ) : null}
          </div>

          <InputField
            id="activar-confirmar"
            label="Confirmar contraseña"
            type="password"
            required
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => { setConfirmar(e.target.value); setError(''); }}
            error={confirmar && !coinciden ? 'Las contraseñas no coinciden.' : ''}
          />

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
              Activar cuenta
            </Button>
            <p className="text-sm text-[var(--color-text-muted)]">
              ¿Ya la activaste?{' '}
              <Link to="/login" className="font-medium text-[var(--color-accent-text)] hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
