/**
 * Hook usePollingNotificaciones
 *
 * Consulta GET /api/notificaciones/pendientes cada 30 segundos mientras el
 * usuario está autenticado. Expone las notificaciones nuevas, el conteo de
 * notificaciones no leídas y una función para marcar una notificación como leída.
 *
 * Valida Requisitos: 5.6, 5.7, 5.12, 6.2
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerNotificacionesPendientes, marcarNotificacionLeida } from '../servicios/api';

const INTERVALO_POLLING_MS = 30_000; // 30 segundos

/**
 * @param {{ autenticado: boolean }} opciones
 * @returns {{
 *   notificaciones: Array,
 *   conteoNoLeidas: number,
 *   marcarLeida: (id: number) => Promise<void>
 * }}
 */
export function usePollingNotificaciones({ autenticado }) {
  // IDs ya vistos para detectar notificaciones nuevas entre ciclos
  const idsVistoRef = useRef(new Set());
  const [notificaciones, setNotificaciones] = useState([]);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const consultarPendientes = useCallback(async () => {
    try {
      const respuesta = await obtenerNotificacionesPendientes();
      if (!montadoRef.current) return;

      const lista = Array.isArray(respuesta?.notificaciones) ? respuesta.notificaciones : [];

      // Filtrar solo las notificaciones que no hemos mostrado aún
      const nuevas = lista.filter((n) => !idsVistoRef.current.has(n.id));

      if (nuevas.length > 0) {
        nuevas.forEach((n) => idsVistoRef.current.add(n.id));
        setNotificaciones((prev) => [...prev, ...nuevas]);
      }
    } catch (error) {
      // Req. 5.12: registrar en consola sin interrumpir la UI
      console.error('[usePollingNotificaciones] Error al consultar notificaciones:', error);
    }
  }, []);

  useEffect(() => {
    if (!autenticado) return undefined;

    // Consulta inmediata al montar / al autenticarse
    consultarPendientes();

    const intervalo = setInterval(consultarPendientes, INTERVALO_POLLING_MS);

    // Cleanup: detener polling al desmontar o al cerrar sesión (Req. 5.7)
    return () => clearInterval(intervalo);
  }, [autenticado, consultarPendientes]);

  /**
   * Marca una notificación como leída en el backend y la elimina de la lista local.
   * @param {number} id
   */
  const marcarLeida = useCallback(async (id) => {
    try {
      await marcarNotificacionLeida(id);
    } catch (error) {
      console.error('[usePollingNotificaciones] Error al marcar notificación como leída:', error);
    } finally {
      // Eliminar de la lista local independientemente del resultado del backend
      if (montadoRef.current) {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      }
    }
  }, []);

  // Req. 6.2: conteo de notificaciones con leida === false
  // Las notificaciones del polling son siempre pendientes (leida = false),
  // pero se calcula explícitamente para robustez ante futuros cambios.
  const conteoNoLeidas = notificaciones.filter((n) => n.leida === false).length;

  return { notificaciones, conteoNoLeidas, marcarLeida };
}

export default usePollingNotificaciones;
