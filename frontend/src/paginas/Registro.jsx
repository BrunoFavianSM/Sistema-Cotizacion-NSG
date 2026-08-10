import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import ErrorState from '../componentes/feedback/ErrorState';
import TurnstileWidget from '../componentes/ui/TurnstileWidget';
import { useAppContext } from '../contexto/AppContext';
import { consultarDni } from '../servicios/api';
import { evaluarFortalezaPassword } from '../utilidades/evaluarFortalezaPassword';

export default function Registro() {
  const navigate = useNavigate();
  const { registrar } = useAppContext();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  // DNI → nombre/apellidos. Por defecto solo lectura (autocompletado de RENIEC).
  // Si la consulta falla, se habilita la carga manual (modoManualNombre).
  const [modoManualNombre, setModoManualNombre] = useState(false);
  const [consultandoDni, setConsultandoDni] = useState(false);
  const [avisoDni, setAvisoDni] = useState('');
  const dniTimer = useRef(null);

  const fortaleza = evaluarFortalezaPassword(password);
  const contrasenasCoinciden = password === confirmarPassword;
  const mostrarAlertaCoincidencia = confirmarPassword.length > 0 && !contrasenasCoinciden;

  const buscarDni = async (valor) => {
    setConsultandoDni(true);
    try {
      const resultado = await consultarDni(valor);
      if (resultado?.exito && resultado.datos) {
        setNombre(resultado.datos.nombre || '');
        setApellidos(resultado.datos.apellidos || '');
        setModoManualNombre(false);
        setAvisoDni('Datos verificados con RENIEC.');
      } else {
        setModoManualNombre(true);
        setAvisoDni('No se pudieron obtener los datos del DNI. Ingrésalos manualmente.');
      }
    } catch (_) {
      setModoManualNombre(true);
      setAvisoDni('No se pudieron obtener los datos del DNI. Ingrésalos manualmente.');
    } finally {
      setConsultandoDni(false);
    }
  };

  const manejarCambioDni = (event) => {
    const valor = event.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    setDni(valor);
    setError('');
    // Resetear el autocompletado al cambiar el DNI.
    setNombre('');
    setApellidos('');
    setModoManualNombre(false);
    setAvisoDni('');
    if (dniTimer.current) clearTimeout(dniTimer.current);
    if (valor.length === 8) {
      dniTimer.current = setTimeout(() => buscarDni(valor), 400);
    }
  };

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validaciones del lado del cliente
    if (!dni.trim()) return setError('El DNI es obligatorio.');
    if (!/^[0-9]{8}$/.test(dni.trim())) return setError('El DNI debe tener 8 dígitos.');
    if (!nombre.trim() || nombre.trim().length < 2) return setError('El nombre es obligatorio.');
    if (!apellidos.trim() || apellidos.trim().length < 2) return setError('Los apellidos son obligatorios.');
    if (!correo.trim()) return setError('El correo electrónico es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setError('El formato del correo no es válido.');
    if (!telefono.trim()) return setError('El teléfono es obligatorio.');

    if (!password) return setError('La contraseña es obligatoria.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!/[A-Z]/.test(password)) return setError('La contraseña debe contener al menos una mayúscula.');
    if (!/[a-z]/.test(password)) return setError('La contraseña debe contener al menos una minúscula.');
    if (!/[0-9]/.test(password)) return setError('La contraseña debe contener al menos un número.');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return setError('La contraseña debe contener al menos un carácter especial.');
    if (!contrasenasCoinciden) return setError('Las contraseñas no coinciden.');

    setCargando(true);

    try {
      const correoNormalizado = correo.trim().toLowerCase();
      const resultado = await registrar({
        password,
        confirmarPassword,
        correo: correoNormalizado,
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        dni: dni.trim(),
        captcha_token: captchaToken
      });

      if (resultado?.exito) {
        navigate('/cotizador');
        return;
      }

      // Cuenta creada antes desde una cotización: enrutar a activación.
      if (resultado?.codigo === 'CUENTA_PENDIENTE_ACTIVACION') {
        navigate(`/activar?correo=${encodeURIComponent(correoNormalizado)}`);
        return;
      }

      setError(resultado?.mensaje || resultado?.error || 'No se pudo completar el registro.');
    } catch (err) {
      setError(err?.error || err?.mensaje || 'Error al procesar el registro. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Nueva cuenta</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Crear cuenta</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Ingresa tu DNI para completar tus datos automáticamente. Te registras para ver precios, crear cotizaciones y usar el asistente.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="registro-form-title"
      >
        <h2 id="registro-form-title" className="text-lg font-semibold text-[var(--color-text)]">Datos de registro</h2>

        <form onSubmit={manejarSubmit} className="mt-4 space-y-4">
          {error ? (
            <ErrorState
              title="No se pudo completar el registro"
              description={error}
              className="p-3"
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            id="registro-dni"
            label="DNI"
            required
            inputMode="numeric"
            value={dni}
            onChange={manejarCambioDni}
            placeholder="Ej. 71234567"
            hint={consultandoDni ? 'Consultando datos del DNI...' : avisoDni}
            className="sm:col-span-2"
          />

          <InputField
            id="registro-nombre"
            label="Nombre"
            required
            autoComplete="given-name"
            value={nombre}
            disabled={!modoManualNombre}
            onChange={(e) => { setNombre(e.target.value); setError(''); }}
            placeholder={modoManualNombre ? 'Ingresa tu nombre' : 'Se completa con tu DNI'}
          />

          <InputField
            id="registro-apellidos"
            label="Apellidos"
            required
            autoComplete="family-name"
            value={apellidos}
            disabled={!modoManualNombre}
            onChange={(e) => { setApellidos(e.target.value); setError(''); }}
            placeholder={modoManualNombre ? 'Ingresa tus apellidos' : 'Se completan con tu DNI'}
          />

          <InputField
            id="registro-correo"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(''); }}
            placeholder="nombre@correo.com"
          />

          <InputField
            id="registro-telefono"
            label="Teléfono"
            type="tel"
            required
            autoComplete="tel"
            value={telefono}
            onChange={(e) => { setTelefono(e.target.value); setError(''); }}
            placeholder="+51 987 654 321"
          />

          <div className="space-y-1.5">
            <label htmlFor="registro-password" className="text-sm font-medium text-[var(--color-text)]">
              Contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>

            <div className="relative">
              <input
                id="registro-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)]"
                placeholder="Crea una contraseña segura"
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

            {/* Medidor de fortaleza */}
            {password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-soft)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${fortaleza.porcentaje}%`,
                      backgroundColor: fortaleza.color,
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: fortaleza.color }}>
                  {fortaleza.label}
                  {fortaleza.nivel === 'debil' && ' — Usa mayúsculas, números y símbolos'}
                  {fortaleza.nivel === 'media' && ' — Buena, pero puedes mejorarla'}
                  {fortaleza.nivel === 'fuerte' && ' — Contraseña segura'}
                </p>
              </div>
            )}

            <p className="text-xs text-[var(--color-text-muted)]">
              Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="registro-confirmar-password" className="text-sm font-medium text-[var(--color-text)]">
              Confirmar contraseña
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            </label>
            <div className="relative">
              <input
                id="registro-confirmar-password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmarPassword}
                onChange={(e) => {
                  setConfirmarPassword(e.target.value);
                  setError('');
                }}
                className={`w-full min-h-11 rounded-[var(--radius-sm)] border px-3 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:border-[var(--color-text-muted)] ${
                  mostrarAlertaCoincidencia
                    ? 'border-[var(--color-danger)]'
                    : confirmarPassword.length > 0 && contrasenasCoinciden
                      ? 'border-[var(--color-success)]'
                      : 'border-[var(--color-border)]'
                } bg-[var(--color-surface)]`}
                placeholder="Repite tu contraseña"
                aria-required="true"
              />
            </div>
            {mostrarAlertaCoincidencia && (
              <p className="text-xs text-[var(--color-danger)]">Las contraseñas no coinciden</p>
            )}
            {confirmarPassword.length > 0 && contrasenasCoinciden && (
              <p className="text-xs text-[var(--color-success)]">Las contraseñas coinciden</p>
            )}
          </div>
          </div>

          <TurnstileWidget onToken={setCaptchaToken} />

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button type="submit" loading={cargando} className="sm:min-w-[12rem]">
              Crear cuenta
            </Button>
            <p className="text-sm text-[var(--color-text-muted)]">
              ¿Ya tienes cuenta?{' '}
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
