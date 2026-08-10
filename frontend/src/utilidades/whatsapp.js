/**
 * Utilidades para enlaces de WhatsApp (wa.me).
 *
 * El cliente confirma su cotización contactando al área de ventas por
 * WhatsApp con un mensaje prearmado que incluye el código de ticket.
 */

/** Deja solo dígitos del número (wa.me no admite '+', espacios ni guiones). */
function normalizarNumero(numero) {
  return String(numero || '').replace(/[^\d]/g, '');
}

/**
 * Construye un enlace wa.me con mensaje opcional prearmado.
 * @param {Object} params
 * @param {string} params.numero - Número con código de país (ej. '51993230740').
 * @param {string} [params.mensaje] - Texto del mensaje (se codifica).
 * @returns {string|null} URL de WhatsApp o null si el número es inválido.
 */
export function construirEnlaceWhatsApp({ numero, mensaje = '' }) {
  const limpio = normalizarNumero(numero);
  if (!limpio) return null;
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${limpio}${texto}`;
}

/**
 * Mensaje prearmado para que el cliente confirme una cotización con ventas.
 * @param {Object} params
 * @param {string} params.codigoTicket
 * @param {string} [params.montoFormateado] - Total ya formateado (ej. 'S/ 1,200.00').
 * @returns {string}
 */
export function construirMensajeConfirmacion({ codigoTicket, montoFormateado } = {}) {
  const partes = [
    'Hola, quiero confirmar mi cotización.',
    codigoTicket ? `Ticket: ${codigoTicket}` : null,
    montoFormateado ? `Total: ${montoFormateado}` : null,
  ].filter(Boolean);
  return partes.join('\n');
}
