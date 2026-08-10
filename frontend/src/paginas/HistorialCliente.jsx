import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../componentes/ui/Badge';
import Button from '../componentes/ui/Button';
import DataTable from '../componentes/ui/DataTable';
import InputField from '../componentes/ui/InputField';
import SelectField from '../componentes/ui/SelectField';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import Modal from '../componentes/ui/Modal';
import ModalDetalleCotizacion from '../componentes/cotizador/ModalDetalleCotizacion';
import {
  consultarHistorialCliente,
  listarClientesRegistrados,
  obtenerCotizacionesPropias,
  exportarExcelCotizacion,
  descargarPdfCotizacion,
  descargarPdfTecnico,
  confirmarCotizacion,
  solicitarConfirmacionCotizacion
} from '../servicios/api';
import { formatearMoneda as formatoMoneda } from '../utilidades/moneda';
import { etiquetaEstado, varianteEstado, OPCIONES_FILTRO_ESTADO } from '../utilidades/estadoCotizacion';
import { construirEnlaceWhatsApp, construirMensajeConfirmacion } from '../utilidades/whatsapp';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </article>
  );
}

export default function HistorialCliente() {
  const toast = useToast();
  const navigate = useNavigate();
  const { monedaVista, formatearMontoSegunMonedaVista, esAdmin, esVendedor, esUsuario, numeroWhatsAppVentas } = useAppContext();
  // El vendedor ve todas las cotizaciones igual que el admin (gestiona ventas).
  const puedeVerTodas = esAdmin || esVendedor;

  // Detalle en modal (todos los roles) y confirmación (admin/vendedor).
  const [detalleTicket, setDetalleTicket] = useState(null);
  const [ticketAConfirmar, setTicketAConfirmar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const [email, setEmail] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [historialCargado, setHistorialCargado] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);

  // Lista de clientes registrados (solo admin)
  const [clientesRegistrados, setClientesRegistrados] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // ─── Carga automática para rol usuario ───────────────────────────────────────
  useEffect(() => {
    if (!esUsuario) return;

    setBuscando(true);
    setError('');

    obtenerCotizacionesPropias()
      .then((respuesta) => {
        if (!respuesta?.exito) {
          setError(respuesta?.mensaje || 'No se pudo cargar tu historial.');
          return;
        }
        const lista = Array.isArray(respuesta?.cotizaciones) ? respuesta.cotizaciones : [];
        setCliente(respuesta?.cliente || null);
        setCotizaciones(lista);
        setHistorialCargado(true);
        setFiltroEstado('todos');
      })
      .catch((err) => {
        setError(err?.mensaje || 'No se pudo cargar tu historial. Intenta nuevamente.');
      })
      .finally(() => setBuscando(false));
  }, [esUsuario]);

  // ─── Carga de clientes registrados (admin o vendedor) ─────────────────────────
  useEffect(() => {
    if (!puedeVerTodas) return;

    setCargandoClientes(true);
    listarClientesRegistrados()
      .then((res) => {
        if (res?.exito) setClientesRegistrados(res.clientes || []);
      })
      .catch(() => {
        // Silencioso: la lista es un complemento, no bloquea el flujo
      })
      .finally(() => setCargandoClientes(false));
  }, [puedeVerTodas]);

  const cotizacionesFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return cotizaciones;
    return cotizaciones.filter((item) => item.estado === filtroEstado);
  }, [cotizaciones, filtroEstado]);

  const descargarPDF = async (codigoTicket, tipo = 'comercial') => {
    try {
      // Servicio central de API: token, manejo de 401 y URL base unificados
      const blob = tipo === 'tecnico'
        ? await descargarPdfTecnico(codigoTicket, monedaVista)
        : await descargarPdfCotizacion(codigoTicket, monedaVista);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${codigoTicket}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error?.codigo === 'COTIZACION_CADUCADA') {
        toast.error(
          'Cotización vencida',
          'Esta cotización superó su fecha de validez y no puede generarse en PDF.'
        );
        return;
      }
      toast.error(
        'Error al generar PDF',
        error?.mensaje || 'Ocurrió un error al generar el PDF.'
      );
    }
  };

  const descargarExcel = async (codigoTicket) => {
    try {
      const blob = await exportarExcelCotizacion(codigoTicket);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `cotizacion-${codigoTicket}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        'No se pudo exportar el Excel',
        err?.mensaje || 'Verifica que estés autenticado e intenta nuevamente.'
      );
    }
  };

  // El cliente confirma su cotización contactando a ventas por WhatsApp.
  const confirmarPorWhatsApp = async (row) => {
    const enlace = construirEnlaceWhatsApp({
      numero: numeroWhatsAppVentas,
      mensaje: construirMensajeConfirmacion({
        codigoTicket: row.codigo_ticket,
        montoFormateado: formatearMontoSegunMonedaVista({
          montoUsd: row?.finanzas?.total?.usd ?? row.precio_total,
          montoPen: row?.finanzas?.total?.pen,
        }),
      }),
    });

    if (!enlace) {
      toast.error('WhatsApp no disponible', 'No hay un número de ventas configurado. Avisa al administrador.');
      return;
    }

    try {
      await solicitarConfirmacionCotizacion(row.codigo_ticket);
    } catch {
      // Silencioso: la marca es un complemento; el cliente igual contacta a ventas.
    }

    window.open(enlace, '_blank', 'noopener,noreferrer');
  };

  // Admin/vendedor verifica la cotización: 'Sin confirmar' → 'Confirmada'.
  const ejecutarConfirmacion = async () => {
    if (!ticketAConfirmar) return;
    setConfirmando(true);
    try {
      const respuesta = await confirmarCotizacion(ticketAConfirmar);
      if (respuesta?.exito) {
        setCotizaciones((prev) =>
          prev.map((c) =>
            c.codigo_ticket === ticketAConfirmar ? { ...c, estado: 'Confirmada' } : c
          )
        );
        toast.success('Cotización confirmada', `El ticket ${ticketAConfirmar} quedó confirmado.`);
        setTicketAConfirmar(null);
      } else {
        toast.error('No se pudo confirmar', respuesta?.mensaje || 'Intenta nuevamente.');
      }
    } catch (err) {
      toast.error('No se pudo confirmar', err?.mensaje || 'Intenta nuevamente.');
    } finally {
      setConfirmando(false);
    }
  };

  const consultarHistorial = async () => {
    setError('');
    const normalizado = email.trim().toLowerCase();

    if (!normalizado) {
      setError('Ingresa un correo para buscar tu historial.');
      return false;
    }

    if (!EMAIL_REGEX.test(normalizado)) {
      setError('Ingresa un correo valido (ejemplo@dominio.com).');
      return false;
    }

    setBuscando(true);

    try {
      const respuesta = await consultarHistorialCliente(normalizado);

      if (!respuesta?.exito) {
        setHistorialCargado(false);
        setCliente(null);
        setCotizaciones([]);
        setError(respuesta?.mensaje || 'No se encontro historial para ese correo.');
        return false;
      }

      const lista = Array.isArray(respuesta?.cotizaciones) ? respuesta.cotizaciones : [];

      setCliente(respuesta?.cliente || { email: normalizado, nombre: 'Cliente' });
      setCotizaciones(lista);
      setHistorialCargado(true);
      setFiltroEstado('todos');

      if (lista.length === 0) {
        toast.info('Sin resultados', 'No hay cotizaciones registradas para este correo.');
      }
      return true;
    } catch (err) {
      setHistorialCargado(false);
      setCliente(null);
      setCotizaciones([]);
      setError(err?.mensaje || 'No se pudo consultar el historial. Intenta nuevamente.');
      return false;
    } finally {
      setBuscando(false);
    }
  };

  // Reintentar carga de cotizaciones propias (rol usuario)
  const reintentarPropias = () => {
    setBuscando(true);
    setError('');
    obtenerCotizacionesPropias()
      .then((respuesta) => {
        if (!respuesta?.exito) {
          setError(respuesta?.mensaje || 'No se pudo cargar tu historial.');
          return;
        }
        const lista = Array.isArray(respuesta?.cotizaciones) ? respuesta.cotizaciones : [];
        setCliente(respuesta?.cliente || null);
        setCotizaciones(lista);
        setHistorialCargado(true);
        setFiltroEstado('todos');
      })
      .catch((err) => {
        setError(err?.mensaje || 'No se pudo cargar tu historial. Intenta nuevamente.');
      })
      .finally(() => setBuscando(false));
  };

  const buscarHistorial = async (event) => {
    event.preventDefault();
    setError('');
    await consultarHistorial();
  };

  const limpiarBusqueda = () => {
    setEmail('');
    setFiltroEstado('todos');
    setBuscando(false);
    setError('');
    setHistorialCargado(false);
    setCliente(null);
    setCotizaciones([]);
  };

  const seleccionarCliente = async (clienteItem) => {
    if (!clienteItem.email) {
      toast.warning('Sin correo', 'Este cliente no tiene correo disponible para consultar.');
      return;
    }
    setEmail(clienteItem.email);
    setError('');
    await consultarHistorialDesdeEmail(clienteItem.email);
  };

  const consultarHistorialDesdeEmail = async (emailParam) => {
    setBuscando(true);
    try {
      const respuesta = await consultarHistorialCliente(emailParam);
      if (!respuesta?.exito) {
        setHistorialCargado(false);
        setCliente(null);
        setCotizaciones([]);
        setError(respuesta?.mensaje || 'No se encontro historial para ese correo.');
        return;
      }
      const lista = Array.isArray(respuesta?.cotizaciones) ? respuesta.cotizaciones : [];
      setCliente(respuesta?.cliente || { email: emailParam, nombre: 'Cliente' });
      setCotizaciones(lista);
      setHistorialCargado(true);
      setFiltroEstado('todos');
      if (lista.length === 0) {
        toast.info('Sin resultados', 'No hay cotizaciones registradas para este correo.');
      }
    } catch (err) {
      setHistorialCargado(false);
      setCliente(null);
      setCotizaciones([]);
      setError(err?.mensaje || 'No se pudo consultar el historial. Intenta nuevamente.');
    } finally {
      setBuscando(false);
    }
  };

  const columnas = [
    {
      key: 'codigo_ticket',
      label: 'Ticket',
      sortable: true,
      render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.codigo_ticket}</span>,
    },
    {
      key: 'fecha_emision',
      label: 'Emitida',
      sortable: true,
      render: (row) => formatearFecha(row.fecha_emision),
    },
    {
      key: 'fecha_validez',
      label: 'Valida hasta',
      sortable: true,
      render: (row) => formatearFecha(row.fecha_validez),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <Badge variant={varianteEstado(row.estado)}>{etiquetaEstado(row.estado)}</Badge>
          {/* Marca visible para admin/vendedor: el cliente ya pidió confirmar */}
          {puedeVerTodas && row.estado === 'Pendiente' && row.fecha_solicitud_confirmacion ? (
            <p className="text-[11px] font-medium text-[var(--color-accent)]">Solicitó confirmar</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'precio_total',
      label: 'Total',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-semibold text-[var(--color-accent-text)]">
            {formatearMontoSegunMonedaVista({
              montoUsd: row?.finanzas?.total?.usd ?? row.precio_total,
              montoPen: row?.finanzas?.total?.pen
            })}
          </span>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {monedaVista === 'USD'
              ? formatearMoneda(row?.finanzas?.total?.pen, 'PEN')
              : formatearMoneda(row?.finanzas?.total?.usd ?? row.precio_total, 'USD')}
          </p>
        </div>
      ),
    },
    {
      key: 'notificacion',
      label: 'Notificacion',
      render: (row) => {
        if (!row.notificacion) {
          return <span className="text-xs text-[var(--color-text-muted)]">Sin envios</span>;
        }

        const variant = row.notificacion.estado === 'enviada'
          ? 'success'
          : row.notificacion.estado === 'fallida'
            ? 'danger'
            : 'warning';

        return (
          <div className="space-y-1">
            <Badge variant={variant}>{row.notificacion.estado}</Badge>
            {row.notificacion.fecha_envio ? (
              <p className="text-[11px] text-[var(--color-text-muted)]">{formatearFecha(row.notificacion.fecha_envio)}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          {/* Ver detalle en la app (todos los roles): no descarga PDF */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetalleTicket(row.codigo_ticket)}
            aria-label={`Ver detalle de ${row.codigo_ticket}`}
          >
            Ver detalle
          </Button>
          {/* Cliente: confirmar su cotización sin confirmar por WhatsApp */}
          {esUsuario && row.estado === 'Pendiente' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => confirmarPorWhatsApp(row)}
              aria-label={`Confirmar ${row.codigo_ticket} por WhatsApp`}
            >
              Confirmar por WhatsApp
            </Button>
          )}
          {/* Admin/vendedor: verificar la cotización */}
          {puedeVerTodas && row.estado === 'Pendiente' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTicketAConfirmar(row.codigo_ticket)}
              aria-label={`Confirmar ${row.codigo_ticket}`}
            >
              Confirmar
            </Button>
          )}
          {/* Validar y Técnico: solo visibles para admin (renderizado condicional, no CSS) */}
          {!esUsuario && (
            <Link
              to={`/validar?ticket=${row.codigo_ticket}`}
              className="inline-flex items-center justify-center min-h-[32px] px-3 py-1 text-sm font-medium rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              aria-label={`Validar ticket ${row.codigo_ticket}`}
              title="Ir al validador con este ticket"
            >
              Validar
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => descargarPDF(row.codigo_ticket, 'comercial')}
            aria-label={`Descargar PDF comercial de ${row.codigo_ticket}`}
          >
            Comercial
          </Button>
          {!esUsuario && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => descargarPDF(row.codigo_ticket, 'tecnico')}
              aria-label={`Descargar PDF tecnico de ${row.codigo_ticket}`}
            >
              Técnico
            </Button>
          )}
          {/* Botón de exportación a Excel — oculto a pedido */}
          {false && !esUsuario && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => descargarExcel(row.codigo_ticket)}
              aria-label={`Exportar Excel de cotización ${row.codigo_ticket}`}
              title="Descargar cotización en formato Excel"
            >
              Excel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {esUsuario ? 'Mi cuenta' : 'Cliente'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Historial de Cotizaciones</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          {esUsuario
            ? 'Consulta tus cotizaciones anteriores listas para descargar en PDF.'
            : 'Consulta tickets anteriores con un flujo simple, accesible y listo para descargar en PDF.'}
        </p>
      </header>

      {/* ── Sección de búsqueda por email: visible para admin y vendedor ── */}
      {puedeVerTodas ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="surface-elevated p-6"
          aria-labelledby="historial-busqueda-title"
          data-tour="historial-buscar"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="historial-busqueda-title" className="text-lg font-semibold text-[var(--color-text)]">Buscar por correo</h2>
            {historialCargado ? (
              <Button variant="ghost" size="sm" onClick={limpiarBusqueda}>
                Nueva busqueda
              </Button>
            ) : null}
          </div>

          <form onSubmit={buscarHistorial} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <InputField
              id="historial-email"
              type="email"
              label="Correo del cliente"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="cliente@correo.com"
              error={error}
              hint="Usa el mismo correo con el que se genero la cotizacion."
            />

            <Button type="submit" loading={buscando} className="sm:min-w-[12rem]">
              Buscar historial
            </Button>
          </form>
        </motion.section>
      ) : null}

      {/* ── Estado de carga ── */}
      {buscando ? (
        <section className="surface-card p-10">
          <LoadingSpinner label={esUsuario ? 'Cargando tus cotizaciones...' : 'Buscando historial...'} />
        </section>
      ) : null}

      {/* ── Estado de error con botón Reintentar ── */}
      {!buscando && error && !historialCargado ? (
        <ErrorState
          title="No se pudo cargar el historial"
          description={error}
          onRetry={esUsuario ? reintentarPropias : (email.trim() ? consultarHistorial : null)}
          retryLabel="Reintentar"
        />
      ) : null}

      {/* ── Lista de clientes registrados: admin/vendedor, cuando no hay historial cargado ── */}
      {puedeVerTodas && !buscando && !historialCargado && !error ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="surface-elevated p-6"
          aria-labelledby="clientes-registrados-title"
          data-tour="historial-clientes"
        >
          <h2 id="clientes-registrados-title" className="mb-4 text-base font-semibold text-[var(--color-text)]">
            Clientes registrados
          </h2>

          {cargandoClientes ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner label="Cargando clientes..." />
            </div>
          ) : clientesRegistrados.length === 0 ? (
            <EmptyState
              title="Sin clientes registrados"
              description="Aun no hay clientes con cotizaciones en el sistema."
            />
          ) : (
            <ul className="divide-y divide-[var(--color-border)]" role="list">
              {clientesRegistrados.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => seleccionarCliente(item)}
                    className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-sm)] px-2 py-3 text-left transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] min-h-[44px]"
                    aria-label={`Ver historial de ${item.nombre || item.email || 'cliente'}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {item.nombre || 'Sin nombre'}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {item.email || 'Correo no disponible'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {item.total_cotizaciones} {item.total_cotizaciones === 1 ? 'cotización' : 'cotizaciones'}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--color-text-muted)]"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      ) : null}

      {/* ── Historial cargado ── */}
      {!buscando && historialCargado ? (
        <>
          <section className="grid gap-4 md:grid-cols-3" data-tour="historial-resumen">
            <StatCard label="Cliente" value={cliente?.nombre || 'Cliente'} helper={cliente?.email || '-'} />
            <StatCard label="Cotizaciones" value={String(cotizaciones.length)} helper="Registros historicos" />
            <StatCard
              label="Monto acumulado"
              value={formatearMontoSegunMonedaVista({
                montoUsd: cotizaciones.reduce((acc, item) => acc + Number((item?.finanzas?.total?.usd ?? item?.precio_total) || 0), 0),
                montoPen: cotizaciones.reduce((acc, item) => acc + Number(item?.finanzas?.total?.pen || 0), 0)
              })}
              helper={monedaVista === 'USD'
                ? `Ref PEN ${formatearMoneda(cotizaciones.reduce((acc, item) => acc + Number(item?.finanzas?.total?.pen || 0), 0), 'PEN')}`
                : `Ref USD ${formatearMoneda(cotizaciones.reduce((acc, item) => acc + Number((item?.finanzas?.total?.usd ?? item?.precio_total) || 0), 0), 'USD')}`}
            />
          </section>

          {/* Estado vacío con CTA al cotizador para rol usuario (Req. 5.10) */}
          {cotizaciones.length === 0 ? (
            esUsuario ? (
              <EmptyState
                title="Aún no tienes cotizaciones"
                description="Cuando generes una cotización aparecerá aquí con todos sus detalles."
                actionLabel="Ir al cotizador"
                onAction={() => navigate('/cotizador')}
              />
            ) : (
              <EmptyState
                title="Sin cotizaciones registradas"
                description="Este correo aun no tiene tickets emitidos en el sistema."
              />
            )
          ) : (
            <DataTable
              caption="Tabla de cotizaciones historicas del cliente"
              columns={columnas}
              data={cotizacionesFiltradas}
              rowKey="id"
              searchKeys={['codigo_ticket', 'estado']}
              searchPlaceholder="Filtrar por ticket o estado..."
              defaultSort={{ key: 'fecha_emision', direction: 'desc' }}
              leftToolbar={(
                <SelectField
                  id="historial-filtro-estado"
                  label="Estado"
                  value={filtroEstado}
                  onChange={(event) => setFiltroEstado(event.target.value)}
                  className="sm:max-w-[15rem]"
                  options={OPCIONES_FILTRO_ESTADO}
                />
              )}
              rightToolbar={<p className="text-xs text-[var(--color-text-muted)]">{cotizacionesFiltradas.length} resultados</p>}
              emptyState={(
                <EmptyState
                  title="No hay resultados con ese filtro"
                  description="Prueba con otro estado o limpia la busqueda de la tabla."
                  actionLabel="Ver todos"
                  onAction={() => setFiltroEstado('todos')}
                />
              )}
            />
          )}
        </>
      ) : null}

      {/* Modal de detalle (solo lectura) */}
      <ModalDetalleCotizacion
        codigoTicket={detalleTicket}
        open={Boolean(detalleTicket)}
        onClose={() => setDetalleTicket(null)}
      />

      {/* Modal de confirmación (admin/vendedor) con advertencia de fijación */}
      <Modal
        open={Boolean(ticketAConfirmar)}
        onClose={() => (confirmando ? null : setTicketAConfirmar(null))}
        size="sm"
        title="Confirmar cotización"
        description={`Vas a confirmar el ticket ${ticketAConfirmar || ''}.`}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTicketAConfirmar(null)} disabled={confirmando}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={ejecutarConfirmacion} loading={confirmando}>
              Confirmar
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[var(--color-text)]">
          Al confirmar, la cotización queda <strong>fijada</strong>: ya no caduca y el cliente no
          podrá pedir cambios. Esta acción es el respaldo del acuerdo con ventas.
        </p>
      </Modal>
    </div>
  );
}

