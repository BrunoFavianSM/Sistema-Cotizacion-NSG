import { useEffect, useState, useCallback } from 'react';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import SelectField from '../componentes/ui/SelectField';
import Modal from '../componentes/ui/Modal';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import ErrorState from '../componentes/feedback/ErrorState';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';
import { pasosModalUsuario } from '../tours/pasos/modales';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'usuario', label: 'Usuario' },
];

const FORM_INICIAL = {
  nombre: '', apellidos: '', correo: '', telefono: '', dni: '',
  rol: 'usuario', estado: 'activa', password: '',
};

export default function AdminUsuarios() {
  const { usuario } = useAppContext();
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create' });
  const [form, setForm] = useState(FORM_INICIAL);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await api.obtenerCuentas();
      setCuentas(data?.cuentas || []);
    } catch {
      setError('No se pudieron cargar las cuentas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => { setForm(FORM_INICIAL); setErrorForm(''); setModal({ open: true, mode: 'create' }); };
  const abrirEditar = (c) => {
    setForm({
      id: c.id, nombre: c.nombre || '', apellidos: c.apellidos || '',
      correo: c.correo || '', telefono: c.telefono || '', dni: c.dni || '',
      rol: c.rol, estado: c.estado, password: '',
    });
    setErrorForm('');
    setModal({ open: true, mode: 'edit' });
  };

  const setCampo = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      if (modal.mode === 'create') {
        await api.crearCuenta({
          password: form.password,
          correo: form.correo.trim().toLowerCase(),
          nombre: form.nombre.trim(), apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim() || undefined, dni: form.dni.trim() || undefined, rol: form.rol,
        });
      } else {
        const datos = { nombre: form.nombre.trim(), apellidos: form.apellidos.trim(), rol: form.rol, estado: form.estado, dni: form.dni.trim() || null };
        if (form.password) datos.password = form.password;
        await api.actualizarCuenta(form.id, datos);
      }
      setModal({ open: false, mode: 'create' });
      await cargar();
    } catch (err) {
      setErrorForm(err?.mensaje || err?.error || 'No se pudo guardar la cuenta.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar la cuenta "${c.nombre_completo || c.correo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarCuenta(c.id);
      await cargar();
    } catch (err) {
      setError(err?.mensaje || 'No se pudo eliminar la cuenta.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="surface-elevated flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Administración</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">Gestión de cuentas</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Administra cuentas de administrador, vendedor y usuario.</p>
        </div>
        <Button onClick={abrirCrear} data-tour="usuarios-nueva">Nueva cuenta</Button>
      </header>

      <section className="surface-card p-4" data-tour="usuarios-lista">
        {cargando ? (
          <LoadingSpinner label="Cargando cuentas..." />
        ) : error ? (
          <ErrorState title="Error" description={error} onRetry={cargar} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Correo</th>
                  <th className="px-3 py-2">DNI</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-medium text-[var(--color-text)]">{c.nombre_completo}</td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">{c.correo || '—'}</td>
                    <td className="px-3 py-2">{c.dni || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-[var(--color-surface-soft)] px-2.5 py-1 text-xs font-medium capitalize">{c.rol}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.estado === 'activa'
                          ? 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]'
                          : c.estado === 'desactivada'
                            ? 'bg-[color:rgba(255,69,58,0.15)] text-[var(--color-danger)]'
                            : 'bg-[color:rgba(255,159,10,0.15)] text-[var(--color-warning)]'
                      }`}>
                        {c.estado === 'activa' ? 'Activa' : c.estado === 'desactivada' ? 'Desactivada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => abrirEditar(c)}>Editar</Button>
                        <Button variant="danger" size="sm" disabled={usuario?.id === c.id} onClick={() => eliminar(c)}>Eliminar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cuentas.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-[var(--color-text-muted)]">No hay cuentas.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={modal.open} onClose={() => !guardando && setModal({ open: false, mode: 'create' })} title={modal.mode === 'create' ? 'Nueva cuenta' : 'Editar cuenta'} pasosTour={pasosModalUsuario}>
        <form onSubmit={guardar} className="space-y-4">
          {errorForm ? (
            <p className="rounded-[var(--radius-sm)] border border-[color:rgba(255,69,58,0.4)] bg-[color:rgba(255,69,58,0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">{errorForm}</p>
          ) : null}

          <InputField id="cu-nombre" label="Nombre" required value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} />
          <InputField id="cu-apellidos" label="Apellidos" required value={form.apellidos} onChange={(e) => setCampo('apellidos', e.target.value)} />
          {modal.mode === 'create' ? (
            <InputField id="cu-correo" label="Correo" type="email" required value={form.correo} onChange={(e) => setCampo('correo', e.target.value)} />
          ) : null}
          <InputField id="cu-telefono" label="Teléfono" value={form.telefono} onChange={(e) => setCampo('telefono', e.target.value)} />
          <InputField id="cu-dni" label="DNI" inputMode="numeric" value={form.dni} onChange={(e) => setCampo('dni', e.target.value.replace(/[^0-9]/g, ''))} />
          <div data-tour="modal-usuario-rol">
            <SelectField id="cu-rol" label="Rol" value={form.rol} onChange={(e) => setCampo('rol', e.target.value)} options={ROLES} />
          </div>
          {modal.mode === 'edit' ? (
            <SelectField id="cu-estado" label="Estado" value={form.estado} onChange={(e) => setCampo('estado', e.target.value)}
              options={[{ value: 'activa', label: 'Activa' }, { value: 'pendiente_activacion', label: 'Pendiente' }, { value: 'desactivada', label: 'Desactivada' }]} />
          ) : null}
          <div data-tour="modal-usuario-password">
            <InputField id="cu-password" label={modal.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'} type="password"
              required={modal.mode === 'create'} value={form.password} onChange={(e) => setCampo('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, mode: 'create' })} disabled={guardando}>Cancelar</Button>
            <Button type="submit" loading={guardando}>{modal.mode === 'create' ? 'Crear' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
