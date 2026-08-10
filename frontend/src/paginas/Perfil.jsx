/**
 * Página de Perfil de Usuario
 *
 * Permite al usuario autenticado gestionar su cuenta: editar datos
 * personales (teléfono y correo), cambiar su contraseña y dar de baja
 * su cuenta (baja lógica).
 */

import { useEffect, useState } from 'react';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import Modal from '../componentes/ui/Modal';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { pasosModalBaja } from '../tours/pasos/modales';
import { useAppContext } from '../contexto/AppContext';
import {
  obtenerPerfilPropio,
  actualizarPerfilPropio,
  cambiarContrasenaPropia,
  desactivarCuentaPropia,
} from '../servicios/api';
import { evaluarFortalezaPassword } from '../utilidades/evaluarFortalezaPassword';

// Mensaje de error legible desde el rechazo del interceptor de axios
// (que rechaza con error.response.data → { error, detalles } o { mensaje }).
function mensajeError(err, fallback) {
  if (err?.detalles?.length) return err.detalles.join('. ');
  return err?.error || err?.mensaje || fallback;
}

const REGLAS_PASSWORD = [
  { test: (p) => p.length >= 8, msg: 'La contraseña debe tener al menos 8 caracteres.' },
  { test: (p) => /[A-Z]/.test(p), msg: 'Debe contener al menos una mayúscula.' },
  { test: (p) => /[a-z]/.test(p), msg: 'Debe contener al menos una minúscula.' },
  { test: (p) => /[0-9]/.test(p), msg: 'Debe contener al menos un número.' },
  { test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), msg: 'Debe contener al menos un carácter especial.' },
];

// ─── Sección: datos personales (editar teléfono y correo) ──────────────────────

function SeccionDatosPersonales({ perfil, cargando, onUpdated }) {
  const toast = useToast();
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (perfil) {
      setTelefono(perfil.telefono || '');
      setCorreo(perfil.correo || '');
    }
  }, [perfil]);

  const sinCambios = perfil
    && telefono.trim() === (perfil.telefono || '')
    && correo.trim().toLowerCase() === (perfil.correo || '');

  const guardar = async (event) => {
    event.preventDefault();
    if (!telefono.trim() || !correo.trim()) {
      toast.warning('Datos incompletos', 'Teléfono y correo son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const resp = await actualizarPerfilPropio({ telefono: telefono.trim(), correo: correo.trim().toLowerCase() });
      if (resp?.exito) {
        toast.success('Datos actualizados', 'Tus datos se guardaron correctamente.');
        onUpdated?.(resp.perfil);
      } else {
        toast.error('No se pudo guardar', mensajeError(resp, 'Intenta nuevamente.'));
      }
    } catch (err) {
      toast.error('No se pudo guardar', mensajeError(err, 'Intenta nuevamente.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="surface-elevated p-6" aria-labelledby="datos-titulo" data-tour="perfil-datos">
      <h2 id="datos-titulo" className="text-lg font-semibold text-[var(--color-text)]">Datos personales</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Actualiza tu teléfono y correo. El nombre solo lo puede cambiar un administrador.
      </p>
      {cargando ? (
        <div className="mt-4"><LoadingSpinner label="Cargando datos..." /></div>
      ) : (
        <form onSubmit={guardar} className="mt-4 grid gap-4 sm:grid-cols-2">
          <InputField
            id="perfil-nombre"
            label="Nombre"
            value={perfil?.nombre || ''}
            disabled
          />
          <InputField
            id="perfil-apellidos"
            label="Apellidos"
            value={perfil?.apellidos || ''}
            disabled
            hint="Para cambiar tu nombre, contacta a un administrador."
          />
          <InputField
            id="perfil-telefono"
            label="Teléfono"
            type="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
          <InputField
            id="perfil-correo"
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" loading={guardando} disabled={sinCambios}>Guardar cambios</Button>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── Sección: cambiar contraseña ───────────────────────────────────────────────

function SeccionCambiarContrasena() {
  const toast = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fuerza = evaluarFortalezaPassword(nueva);
  const coinciden = nueva.length > 0 && nueva === confirmar;

  const guardar = async (event) => {
    event.preventDefault();
    if (!actual) {
      toast.warning('Falta la contraseña actual', 'Ingresa tu contraseña actual.');
      return;
    }
    const reglaFallida = REGLAS_PASSWORD.find((r) => !r.test(nueva));
    if (reglaFallida) {
      toast.warning('Contraseña insegura', reglaFallida.msg);
      return;
    }
    if (!coinciden) {
      toast.warning('No coinciden', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    setGuardando(true);
    try {
      const resp = await cambiarContrasenaPropia({
        contrasena_actual: actual,
        nueva_password: nueva,
        confirmar_password: confirmar,
      });
      if (resp?.exito) {
        toast.success('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
        setActual(''); setNueva(''); setConfirmar('');
      } else {
        toast.error('No se pudo cambiar', mensajeError(resp, 'Intenta nuevamente.'));
      }
    } catch (err) {
      toast.error('No se pudo cambiar', mensajeError(err, 'Intenta nuevamente.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="surface-elevated p-6" aria-labelledby="password-titulo" data-tour="perfil-password">
      <h2 id="password-titulo" className="text-lg font-semibold text-[var(--color-text)]">Cambiar contraseña</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
      </p>
      <form onSubmit={guardar} className="mt-4 grid gap-4 sm:max-w-md">
        <InputField id="pw-actual" label="Contraseña actual" type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" required />
        <div>
          <InputField id="pw-nueva" label="Nueva contraseña" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" required />
          {nueva ? (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                <div className="h-full transition-all" style={{ width: `${fuerza.porcentaje}%`, backgroundColor: fuerza.color }} />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Seguridad: {fuerza.label}</p>
            </div>
          ) : null}
        </div>
        <InputField
          id="pw-confirmar"
          label="Confirmar nueva contraseña"
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
          required
          error={confirmar && !coinciden ? 'Las contraseñas no coinciden.' : ''}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={guardando}>Cambiar contraseña</Button>
        </div>
      </form>
    </section>
  );
}

// ─── Sección: dar de baja la cuenta (baja lógica) ──────────────────────────────

function SeccionBaja() {
  const toast = useToast();
  const { logout } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [procesando, setProcesando] = useState(false);

  const confirmar = async () => {
    if (!password) {
      toast.warning('Falta la contraseña', 'Ingresa tu contraseña para confirmar la baja.');
      return;
    }
    setProcesando(true);
    try {
      const resp = await desactivarCuentaPropia({ password });
      if (resp?.exito) {
        toast.success('Cuenta dada de baja', 'Tu cuenta fue desactivada. Cerrando sesión...');
        setModalOpen(false);
        setTimeout(() => logout(), 800);
      } else {
        toast.error('No se pudo dar de baja', mensajeError(resp, 'Intenta nuevamente.'));
      }
    } catch (err) {
      toast.error('No se pudo dar de baja', mensajeError(err, 'Intenta nuevamente.'));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="surface-elevated p-6 border border-[color:rgba(255,69,58,0.3)]" aria-labelledby="baja-titulo" data-tour="perfil-baja">
      <h2 id="baja-titulo" className="text-lg font-semibold text-[var(--color-danger)]">Dar de baja mi cuenta</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Tu cuenta quedará desactivada y no podrás iniciar sesión. Tus cotizaciones se conservan. Un administrador puede reactivarla.
      </p>
      <div className="mt-4">
        <Button variant="danger" onClick={() => { setPassword(''); setModalOpen(true); }}>Dar de baja</Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => (procesando ? null : setModalOpen(false))}
        size="sm"
        title="Confirmar baja de cuenta"
        description="Esta acción desactiva tu cuenta. Para confirmar, ingresa tu contraseña."
        pasosTour={pasosModalBaja}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={procesando}>Cancelar</Button>
            <Button variant="danger" onClick={confirmar} loading={procesando}>Dar de baja</Button>
          </div>
        )}
      >
        <div data-tour="modal-baja-password">
          <InputField
            id="baja-password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </Modal>
    </section>
  );
}

export default function Perfil() {
  const { usuario } = useAppContext();

  const [perfil, setPerfil] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  useEffect(() => {
    let activo = true;
    obtenerPerfilPropio()
      .then((resp) => { if (activo && resp?.exito) setPerfil(resp.perfil); })
      .catch(() => {})
      .finally(() => { if (activo) setCargandoPerfil(false); });
    return () => { activo = false; };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Mi cuenta
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
          Perfil
        </h1>
        {usuario?.nombre_completo || usuario?.username ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {usuario.nombre_completo || usuario.username}
            {usuario.correo ? (
              <span className="ml-2 text-[var(--color-text-muted)]">· {usuario.correo}</span>
            ) : null}
          </p>
        ) : null}
      </header>

      {/* Gestión de cuenta */}
      <SeccionDatosPersonales perfil={perfil} cargando={cargandoPerfil} onUpdated={setPerfil} />
      <SeccionCambiarContrasena />

      {/* Baja de cuenta (acción peligrosa, al final) */}
      <SeccionBaja />
    </div>
  );
}
