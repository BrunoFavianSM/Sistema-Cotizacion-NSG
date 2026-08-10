/**
 * Estados de cotización — etiquetas y variantes de Badge centralizadas.
 *
 * Fuente única de verdad para mostrar el estado de una cotización en la UI,
 * evitando mapas duplicados entre páginas (historial, validador, etc.).
 *
 * Estados del backend: 'Pendiente' | 'Confirmada' | 'Completada' | 'Caducada' | 'Reclamada'.
 * - 'Pendiente'  → "Sin confirmar" (el cliente aún no la confirmó con ventas).
 * - 'Confirmada' → verificada por admin/vendedor; ya no caduca.
 * - 'Caducada'   → "Vencida" (superó su validez sin confirmar).
 * - 'Reclamada'  → sinónimo legacy de 'Completada'.
 */

export const ESTADO_LABELS = {
  Pendiente: 'Sin confirmar',
  Confirmada: 'Confirmada',
  Completada: 'Completada',
  Reclamada: 'Completada',
  Caducada: 'Vencida',
};

export const ESTADO_VARIANTS = {
  Pendiente: 'warning',
  Confirmada: 'info',
  Completada: 'success',
  Reclamada: 'success',
  Caducada: 'danger',
};

/** Etiqueta visible para un estado de cotización. */
export function etiquetaEstado(estado) {
  return ESTADO_LABELS[estado] || estado || 'Sin estado';
}

/** Variante de Badge para un estado de cotización. */
export function varianteEstado(estado) {
  return ESTADO_VARIANTS[estado] || 'neutral';
}

/** Opciones para filtros de estado (incluye "Todos"). */
export const OPCIONES_FILTRO_ESTADO = [
  { value: 'todos', label: 'Todos' },
  { value: 'Pendiente', label: 'Sin confirmar' },
  { value: 'Confirmada', label: 'Confirmada' },
  { value: 'Completada', label: 'Completada' },
  { value: 'Caducada', label: 'Vencida' },
];
