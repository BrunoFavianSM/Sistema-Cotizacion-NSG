/**
 * Servicio del Asistente IA - NSG Concierge v2
 *
 * Funciones HTTP para los 5 endpoints v2 del asistente IA.
 * Usa la instancia Axios centralizada de api.js (URL base, JWT, interceptores).
 *
 * Valida Requisitos: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import api, { ASISTENTE_TIMEOUT_MS } from './api.js';

// ============================================
// FUNCIONES DEL ASISTENTE IA v2
// ============================================

/**
 * Inicia una nueva sesión del asistente IA.
 * El usuario_id es opcional (permite uso anónimo).
 *
 * @param {number|null} usuario_id - ID del usuario autenticado (opcional)
 * @returns {Promise<{exito: boolean, sesion_id?: string, error?: string}>}
 */
export const nuevaSesion = async (usuario_id = null) => {
  try {
    const payload = {};
    if (usuario_id !== null && usuario_id !== undefined) {
      payload.usuario_id = usuario_id;
    }
    const response = await api.post('/asistente/nueva-sesion', payload, { timeout: ASISTENTE_TIMEOUT_MS });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.error ||
      error?.response?.data?.mensaje ||
      'No se pudo iniciar la sesión del asistente.';
    return { exito: false, error: mensaje };
  }
};

/**
 * Envía un mensaje del usuario al asistente IA.
 * El backend ejecuta el loop Double-Check internamente antes de responder.
 *
 * @param {string} sesion_id - UUID de la sesión activa
 * @param {string} mensaje - Texto del mensaje del usuario
 * @param {number|null} usuario_id - ID del usuario autenticado (opcional)
 * @returns {Promise<{
 *   exito: boolean,
 *   respuesta?: string,
 *   quick_replies?: string[],
 *   semaforo?: object,
 *   configuracion_propuesta?: object,
 *   error?: string
 * }>}
 */
export const enviarMensaje = async (sesion_id, mensaje, usuario_id = null, configuracion_actual = null) => {
  try {
    const payload = { sesion_id, mensaje };
    if (usuario_id !== null && usuario_id !== undefined) {
      payload.usuario_id = usuario_id;
    }
    if (configuracion_actual) {
      payload.configuracion_actual = configuracion_actual;
    }
    const response = await api.post('/asistente/mensaje', payload, { timeout: ASISTENTE_TIMEOUT_MS });
    return response.data;
  } catch (error) {
    const mensaje_error =
      error?.mensaje ||
      error?.error ||
      error?.response?.data?.mensaje ||
      'No se pudo enviar el mensaje al asistente.';
    return { exito: false, error: mensaje_error };
  }
};

/**
 * Valida la compatibilidad de una configuración de componentes.
 * Ejecuta el Double-Check de forma explícita desde el frontend.
 *
 * @param {{
 *   procesador: number,
 *   placa_madre: number,
 *   ram: number[],
 *   almacenamiento: number,
 *   gpu: number,
 *   fuente: number,
 *   case: number
 * }} producto_ids - IDs de los productos a validar
 * @returns {Promise<{valida: boolean, errores?: string[], advertencias?: string[], error?: string}>}
 */
export const validarConfiguracion = async (producto_ids) => {
  try {
    const response = await api.post('/asistente/validar-configuracion', { producto_ids });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.error ||
      error?.response?.data?.mensaje ||
      'No se pudo validar la configuración.';
    return { exito: false, valida: false, error: mensaje };
  }
};

/**
 * Obtiene el historial de sesiones y mensajes de un usuario autenticado.
 * Requiere token JWT válido (el interceptor de api.js lo agrega automáticamente).
 *
 * @param {number} usuario_id - ID del usuario autenticado
 * @returns {Promise<{exito: boolean, sesiones?: Array, error?: string}>}
 */
export const obtenerHistorial = async (usuario_id) => {
  try {
    const response = await api.get(`/asistente/historial/${usuario_id}`);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.error ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener el historial del asistente.';
    return { exito: false, error: mensaje };
  }
};

/**
 * Obtiene todos los mensajes de una sesión específica.
 * Permite acceso anónimo usando solo el sesion_id como identificador.
 *
 * @param {string} sesion_id - UUID de la sesión
 * @returns {Promise<{exito: boolean, mensajes?: Array, error?: string}>}
 */
export const obtenerSesion = async (sesion_id) => {
  try {
    const response = await api.get(`/asistente/sesion/${sesion_id}`);
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.error ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener los mensajes de la sesión.';
    return { exito: false, error: mensaje };
  }
};
