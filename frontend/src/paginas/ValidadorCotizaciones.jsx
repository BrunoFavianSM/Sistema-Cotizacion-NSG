import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../componentes/ui/Badge';
import Button from '../componentes/ui/Button';
import DataTable from '../componentes/ui/DataTable';
import InputField from '../componentes/ui/InputField';
import Modal from '../componentes/ui/Modal';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import SuccessState from '../componentes/feedback/SuccessState';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';
import { formatearMoneda as formatoMoneda } from '../utilidades/moneda';
import { etiquetaEstado, varianteEstado } from '../utilidades/estadoCotizacion';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearMoneda(monto, moneda = 'USD') {
  return formatoMoneda(monto, moneda);
}

function disponibilidad(componente) {
  if (Number(componente?.stock_actual || 0) > 0) {
    return { etiqueta: 'En stock', variant: 'success' };
  }
  if (componente?.disponible_a_pedido) {
    return { etiqueta: 'A pedido', variant: 'warning' };
  }
  return { etiqueta: 'No disponible', variant: 'danger' };
}

function StatCard({ label, value, helper, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-surface-soft)]',
    info: 'border-[color:rgba(10,132,255,0.35)] bg-[var(--color-accent-soft)]',
    success: 'border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)]',
    warning: 'border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)]',
  };

  return (
    <article className={`rounded-[var(--radius-md)] border p-4 ${toneClass[tone] || toneClass.neutral}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </article>
  );
}

export default function ValidadorCotizaciones() {
  const { autenticado, monedaVista, formatearMontoSegunMonedaVista } = useAppContext();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [codigoTicket, setCodigoTicket] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [reclamando, setReclamando] = useState(false);
  const [notificando, setNotificando] = useState(false);
  const [error, setError] = useState('');
  const [cotizacion, setCotizacion] = useState(null);
  const [confirmarReclamoOpen, setConfirmarReclamoOpen] = useState(false);
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);

  // Auto-validar ticket si viene por query param (?ticket=NSG-2026-XXXX) — Req. 8.1–8.6
  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (!ticketParam || !ticketParam.trim()) return;

    const codigo = ticketParam.trim().toUpperCase();
    setCodigoTicket(codigo); // Pre-rellenar campo visible (Req. 8.6)

    // Ejecutar validación automática sin mostrar toast (Req. 8.5)
    setBuscando(true);
    setCotizacion(null);
    setError('');

    api.validarCotizacion(codigo)
      .then((resultado) => {
        if (!resultado?.valida) {
          setError(resultado?.mensaje || 'No se encontró una cotización válida con ese código.');
          return;
        }
        setCotizacion(resultado.cotizacion);
        // No mostrar toast en auto-validación (Req. 8.5)
      })
      .catch((err) => {
        setError(err?.mensaje || 'Error al consultar la cotización.');
      })
      .finally(() => {
        setBuscando(false);
      });
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const componentes = useMemo(() => {
    if (!Array.isArray(cotizacion?.componentes)) return [];
    return cotizacion.componentes.map((item, index) => ({
      ...item,
      __rowKey: `${item.id_producto ?? item.id ?? 'row'}-${index}`,
    }));
  }, [cotizacion]);

  const columnas = [
    {
      key: 'nombre',
      label: 'Componente',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--color-text)]">{row.nombre}</p>
          <p className="text-xs capitalize text-[var(--color-text-muted)]">{String(row.categoria || '').replace('_', ' ')}</p>
        </div>
      ),
    },
    {
      key: 'cantidad',
      label: 'Cant.',
      sortable: true,
      render: (row) => <span className="font-medium text-[var(--color-text)]">{row.cantidad}</span>,
    },
    {
      key: 'precio_historico',
      label: 'Original',
      sortable: true,
      align: 'right',
      render: (row) => formatearMontoSegunMonedaVista({ montoUsd: row.precio_historico }),
    },
    {
      key: 'precio_actual',
      label: 'Actual',
      sortable: true,
      align: 'right',
      render: (row) => formatearMontoSegunMonedaVista({ montoUsd: row.precio_actual }),
    },
    {
      key: 'diferencia_unitaria',
      label: 'Diferencia',
      sortable: true,
      align: 'right',
      render: (row) => {
        const delta = Number(row.diferencia_unitaria || 0);
        if (Math.abs(delta) < 0.01) {
          return <span className="text-[var(--color-text-muted)]">Sin cambio</span>;
        }

        return (
          <span className={`font-semibold ${delta > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
            {delta > 0 ? '+' : ''}
            {formatearMontoSegunMonedaVista({ montoUsd: delta })}
          </span>
        );
      },
    },
    {
      key: 'disponibilidad',
      label: 'Disponibilidad',
      render: (row) => {
        const estado = disponibilidad(row);
        return <Badge variant={estado.variant}>{estado.etiqueta}</Badge>;
      },
    },
  ];

  const validarPorCodigo = async () => {
    setError('');
    const codigo = codigoTicket.trim().toUpperCase();
    if (!codigo) {
      setError('Ingresa un código de ticket válido.');
      return false;
    }

    setBuscando(true);
    setCotizacion(null);

    try {
      const resultado = await api.validarCotizacion(codigo);

      if (!resultado?.valida) {
        setError(resultado?.mensaje || 'No se encontró una cotización válida con ese código.');
        return false;
      }

      setCotizacion(resultado.cotizacion);
      toast.success('Cotización encontrada', `Ticket ${resultado.cotizacion?.codigo_ticket || codigo}`);
      return true;
    } catch (err) {
      setError(err?.mensaje || 'Error al consultar la cotización.');
      return false;
    } finally {
      setBuscando(false);
    }
  };

  const buscarCotizacion = async (event) => {
    event.preventDefault();
    await validarPorCodigo();
  };

  const limpiarBusqueda = () => {
    setCodigoTicket('');
    setError('');
    setCotizacion(null);
    setConfirmarReclamoOpen(false);
  };

  const marcarComoReclamada = async () => {
    if (!cotizacion?.codigo_ticket) return;

    setReclamando(true);
    setError('');

    try {
      await api.marcarComoReclamada(cotizacion.codigo_ticket);
      setCotizacion((prev) => (prev ? { ...prev, estado: 'Completada' } : prev));
      setConfirmarReclamoOpen(false);
      toast.success('Cotizacion completada', 'Se actualizo el estado correctamente.');
    } catch (err) {
      setError(err?.mensaje || 'No se pudo actualizar el estado de la cotización.');
      toast.error('Error al actualizar', 'Intenta nuevamente en unos segundos.');
    } finally {
      setReclamando(false);
    }
  };

  const confirmarCotizacionActual = async () => {
    if (!cotizacion?.codigo_ticket) return;

    setConfirmandoEstado(true);
    setError('');

    try {
      await api.confirmarCotizacion(cotizacion.codigo_ticket);
      setCotizacion((prev) => (prev ? { ...prev, estado: 'Confirmada' } : prev));
      setConfirmarOpen(false);
      toast.success('Cotizacion confirmada', 'La cotización quedó confirmada y fijada.');
    } catch (err) {
      setError(err?.mensaje || 'No se pudo confirmar la cotización.');
      toast.error('Error al confirmar', 'Intenta nuevamente en unos segundos.');
    } finally {
      setConfirmandoEstado(false);
    }
  };

  const notificarClienteListo = async () => {
    if (!cotizacion?.codigo_ticket) return;

    setNotificando(true);
    try {
      const respuesta = await api.notificarCotizacionLista(cotizacion.codigo_ticket);
      toast.success('Notificacion enviada', respuesta?.mensaje || 'Se envio el correo al cliente.');
    } catch (err) {
      toast.error('No se pudo notificar', err?.mensaje || 'Intenta nuevamente.');
    } finally {
      setNotificando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="surface-card p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Debes iniciar sesión para validar cotizaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Operaciones</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Validador de Cotizaciones</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Verifica estado, precios y disponibilidad antes de confirmar la reclamación de un ticket.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="validador-busqueda-title"
        data-tour="validador-buscar"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="validador-busqueda-title" className="text-lg font-semibold text-[var(--color-text)]">Buscar ticket</h2>
          {(cotizacion || error) ? (
            <Button variant="ghost" size="sm" onClick={limpiarBusqueda}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <form onSubmit={buscarCotizacion} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <InputField
            id="validador-codigo-ticket"
            label="Código de ticket"
            required
            value={codigoTicket}
            onChange={(event) => {
              setCodigoTicket(event.target.value.toUpperCase());
              setError('');
            }}
            placeholder="NSG-2026-0001"
            hint="Formato esperado: NSG-AÑO-NÚMERO"
          />

          <Button type="submit" loading={buscando} className="sm:min-w-[12rem]">
            Validar ticket
          </Button>
        </form>
      </motion.section>

      {buscando ? (
        <section className="surface-card p-10">
          <LoadingSpinner label="Validando cotización..." />
        </section>
      ) : null}

      {!buscando && error ? (
        <ErrorState
          title="No se pudo validar"
          description={error}
          onRetry={codigoTicket.trim() ? validarPorCodigo : null}
          retryLabel="Reintentar"
        />
      ) : null}

      {!buscando && !error && !cotizacion ? (
        <EmptyState
          title="Sin ticket seleccionado"
          description="Ingresa un código para consultar la cotización y revisar su detalle completo."
        />
      ) : null}

      {cotizacion ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-tour="validador-resultado">
            <StatCard
              label="Ticket"
              value={cotizacion.codigo_ticket || '-'}
              helper={`Estado actual: ${cotizacion.estado || 'Sin estado'}`}
              tone="info"
            />
            <StatCard
              label="Precio original"
              value={formatearMontoSegunMonedaVista({
                montoUsd: cotizacion?.finanzas?.historico?.total?.usd ?? cotizacion.precio_total_historico,
                montoPen: cotizacion?.finanzas?.historico?.total?.pen
              })}
              helper={monedaVista === 'USD'
                ? `Emitida: ${formatearFecha(cotizacion.fecha_emision)} • Ref PEN ${formatearMoneda(cotizacion?.finanzas?.historico?.total?.pen, 'PEN')}`
                : `Emitida: ${formatearFecha(cotizacion.fecha_emision)} • Ref USD ${formatearMoneda(cotizacion?.finanzas?.historico?.total?.usd ?? cotizacion.precio_total_historico, 'USD')}`}
            />
            <StatCard
              label="Subtotal neto"
              value={formatearMontoSegunMonedaVista({
                montoUsd: cotizacion?.finanzas?.historico?.subtotal_neto?.usd,
                montoPen: cotizacion?.finanzas?.historico?.subtotal_neto?.pen
              })}
              helper={`IGV ${Number(cotizacion?.finanzas?.historico?.igv?.porcentaje || 0).toFixed(2)}%: ${formatearMontoSegunMonedaVista({
                montoUsd: cotizacion?.finanzas?.historico?.igv?.usd,
                montoPen: cotizacion?.finanzas?.historico?.igv?.pen
              })}`}
            />
            <StatCard
              label="Precio actual"
              value={formatearMontoSegunMonedaVista({
                montoUsd: cotizacion?.finanzas?.actual?.total?.usd ?? cotizacion.precio_total_actual,
                montoPen: cotizacion?.finanzas?.actual?.total?.pen
              })}
              helper={monedaVista === 'USD'
                ? `Válida hasta: ${formatearFecha(cotizacion.fecha_validez)} • Ref PEN ${formatearMoneda(cotizacion?.finanzas?.actual?.total?.pen, 'PEN')}`
                : `Válida hasta: ${formatearFecha(cotizacion.fecha_validez)} • Ref USD ${formatearMoneda(cotizacion?.finanzas?.actual?.total?.usd ?? cotizacion.precio_total_actual, 'USD')}`}
            />
            <StatCard
              label="Diferencia total"
              value={`${Number(cotizacion.diferencia_total || 0) > 0 ? '+' : ''}${formatearMontoSegunMonedaVista({
                montoUsd: cotizacion.diferencia_total,
                montoPen: (cotizacion?.finanzas?.actual?.total?.pen || 0) - (cotizacion?.finanzas?.historico?.total?.pen || 0)
              })}`}
              helper={monedaVista === 'USD'
                ? `Válida hasta: ${formatearFecha(cotizacion.fecha_validez)} • Ref PEN ${formatearMoneda((cotizacion?.finanzas?.actual?.total?.pen || 0) - (cotizacion?.finanzas?.historico?.total?.pen || 0), 'PEN')}`
                : `Válida hasta: ${formatearFecha(cotizacion.fecha_validez)} • Ref USD ${formatearMoneda(cotizacion.diferencia_total, 'USD')}`}
              tone={Number(cotizacion.diferencia_total || 0) > 0 ? 'warning' : 'success'}
            />
          </section>

          <section className="surface-elevated p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Resumen</p>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">Detalle de validación</h2>
              </div>
              <Badge variant={varianteEstado(cotizacion.estado)}>{etiquetaEstado(cotizacion.estado)}</Badge>
            </div>

            {cotizacion.hay_cambios_precio ? (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2 text-sm text-[var(--color-warning)]">
                Se detectaron variaciones de precio respecto a la cotización original.
              </p>
            ) : (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)] px-3 py-2 text-sm text-[var(--color-success)]">
                Los precios se mantienen alineados con la emisión original.
              </p>
            )}

            {cotizacion.estado === 'Completada' ? (
              <SuccessState
                className="mt-4"
                title="Ticket completado"
                description="No se requieren acciones adicionales para este ticket."
              />
            ) : cotizacion.estado === 'Pendiente' ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">¿Confirmar esta cotización?</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Verifica el acuerdo con el cliente. Una vez confirmada, queda fijada y no caduca.</p>
                </div>
                <Button onClick={() => setConfirmarOpen(true)}>Confirmar cotización</Button>
              </div>
            ) : cotizacion.estado === 'Confirmada' ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">¿Completar la venta?</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Esta acción marcará el ticket como completado en el sistema.</p>
                </div>
                <Button onClick={() => setConfirmarReclamoOpen(true)}>Marcar como completada</Button>
              </div>
            ) : null}

            {(cotizacion.estado === 'Completada' || cotizacion.estado === 'Confirmada' || cotizacion.estado === 'Pendiente') ? (
              <div className="mt-3 flex justify-end">
                <Button variant="secondary" onClick={notificarClienteListo} loading={notificando}>
                  Notificar equipo listo
                </Button>
              </div>
            ) : null}
          </section>

          <DataTable
            caption="Tabla de componentes de la cotización validada"
            columns={columnas}
            data={componentes}
            rowKey="__rowKey"
            searchKeys={['nombre', 'categoria']}
            searchPlaceholder="Filtrar componentes..."
            defaultSort={{ key: 'nombre', direction: 'asc' }}
            rightToolbar={<p className="text-xs text-[var(--color-text-muted)]">{componentes.length} componentes</p>}
            emptyState={(
              <EmptyState
                title="No hay componentes"
                description="La cotización no incluye componentes registrados para visualizar."
              />
            )}
          />
        </>
      ) : null}

      <Modal
        open={confirmarReclamoOpen}
        onClose={() => setConfirmarReclamoOpen(false)}
        title="Confirmar reclamación"
        description="Esta acción cambiara el estado del ticket a Completada."
        size="sm"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmarReclamoOpen(false)} disabled={reclamando}>
              Cancelar
            </Button>
            <Button variant="success" onClick={marcarComoReclamada} loading={reclamando}>
              Confirmar
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Ticket <span className="font-semibold text-[var(--color-text)]">{cotizacion?.codigo_ticket || '-'}</span>. Verifica que el cliente esté presente antes de confirmar.
        </p>
      </Modal>

      <Modal
        open={confirmarOpen}
        onClose={() => (confirmandoEstado ? null : setConfirmarOpen(false))}
        title="Confirmar cotización"
        description={`Ticket ${cotizacion?.codigo_ticket || ''}.`}
        size="sm"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmarOpen(false)} disabled={confirmandoEstado}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmarCotizacionActual} loading={confirmandoEstado}>
              Confirmar
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[var(--color-text)]">
          Al confirmar, la cotización queda <strong>fijada</strong>: ya no caduca y el cliente no
          podrá pedir cambios. Es el respaldo del acuerdo con ventas.
        </p>
      </Modal>
    </div>
  );
}
