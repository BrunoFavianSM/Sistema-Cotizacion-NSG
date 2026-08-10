/**
 * Modal de detalle de una cotización (solo lectura).
 *
 * Permite ver los componentes de una cotización dentro de la app, sin
 * descargar el PDF. Usa el endpoint existente GET /cotizaciones/:codigoTicket
 * (api.consultarCotizacion), que ya devuelve los componentes y finanzas.
 */

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import LoadingSpinner from '../feedback/LoadingSpinner';
import ErrorState from '../feedback/ErrorState';
import { useAppContext } from '../../contexto/AppContext';
import { consultarCotizacion } from '../../servicios/api';
import { etiquetaEstado, varianteEstado } from '../../utilidades/estadoCotizacion';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default function ModalDetalleCotizacion({ codigoTicket, open, onClose }) {
  const { formatearMontoSegunMonedaVista } = useAppContext();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [cotizacion, setCotizacion] = useState(null);

  useEffect(() => {
    if (!open || !codigoTicket) return undefined;

    let activo = true;
    setCargando(true);
    setError('');
    setCotizacion(null);

    consultarCotizacion(codigoTicket)
      .then((respuesta) => {
        if (!activo) return;
        if (respuesta?.exito && respuesta.cotizacion) {
          setCotizacion(respuesta.cotizacion);
        } else {
          setError(respuesta?.mensaje || 'No se pudo cargar el detalle de la cotización.');
        }
      })
      .catch((err) => {
        if (!activo) return;
        // 410: cotización caducada (superó su validez sin confirmar)
        if (err?.codigo === 'COTIZACION_CADUCADA' || err?.response?.status === 410) {
          setError('Esta cotización venció y ya no puede consultarse en detalle.');
        } else {
          setError(err?.mensaje || 'No se pudo cargar el detalle de la cotización.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [open, codigoTicket]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Cotización ${codigoTicket || ''}`}
      description="Detalle de los componentes incluidos."
    >
      {cargando ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner label="Cargando detalle..." />
        </div>
      ) : error ? (
        <ErrorState title="No se pudo cargar el detalle" description={error} />
      ) : cotizacion ? (
        <div className="space-y-5">
          {/* Resumen de cabecera */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">Estado:</span>
              <Badge variant={varianteEstado(cotizacion.estado)}>{etiquetaEstado(cotizacion.estado)}</Badge>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Emitida:</span>{' '}
              <span className="font-medium text-[var(--color-text)]">{formatearFecha(cotizacion.fecha_emision)}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Válida hasta:</span>{' '}
              <span className="font-medium text-[var(--color-text)]">{formatearFecha(cotizacion.fecha_validez)}</span>
            </div>
          </div>

          {/* Tabla de componentes */}
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-left">
                  <th className="px-3 py-2 font-semibold text-[var(--color-text-muted)]">Componente</th>
                  <th className="px-3 py-2 font-semibold text-[var(--color-text-muted)]">Categoría</th>
                  <th className="px-3 py-2 text-center font-semibold text-[var(--color-text-muted)]">Cant.</th>
                  <th className="px-3 py-2 text-right font-semibold text-[var(--color-text-muted)]">P. unitario</th>
                  <th className="px-3 py-2 text-right font-semibold text-[var(--color-text-muted)]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(cotizacion.componentes || []).map((c) => {
                  const precioUsd = Number(c.precio_unitario_total_usd ?? c.precio_unitario ?? 0);
                  const cantidad = Number(c.cantidad ?? 1);
                  return (
                    <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-2 text-[var(--color-text)]">{c.nombre}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{c.categoria || '-'}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-[var(--color-text)]">{cantidad}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text)]">
                        {formatearMontoSegunMonedaVista({ montoUsd: precioUsd })}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-[var(--color-text)]">
                        {formatearMontoSegunMonedaVista({ montoUsd: precioUsd * cantidad })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <span className="text-sm text-[var(--color-text-muted)]">Total</span>
            <span className="text-lg font-semibold text-[var(--color-accent-text)]">
              {formatearMontoSegunMonedaVista({
                montoUsd: Number(cotizacion?.finanzas?.total?.usd ?? cotizacion.precio_total ?? 0),
                montoPen: cotizacion?.finanzas?.total?.pen,
              })}
            </span>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
