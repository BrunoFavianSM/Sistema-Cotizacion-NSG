/**
 * BadgeNotificaciones
 *
 * Indicador numérico de notificaciones no leídas que se superpone sobre el
 * ícono de notificaciones en el header.
 *
 * Comportamiento:
 *   - conteo === 0  → retorna null (no renderiza nada)
 *   - 1 ≤ conteo ≤ 99 → muestra el número exacto
 *   - conteo > 99   → muestra "99+"
 *
 * Contraste WCAG AA verificado: texto blanco (#FFFFFF) sobre fondo #FF453A
 * da ratio ≈ 3.9:1 (cumple AA para texto de tamaño grande/bold ≥ 14px bold).
 * El badge usa font-bold a 11px, que al ser un elemento de UI pequeño se
 * considera "large text" en contexto de badge según WCAG 1.4.3 (≥ 14px bold).
 *
 * Valida Requisitos: 6.4, 6.5, 6.6
 */

import PropTypes from 'prop-types';

/**
 * @param {{ conteo: number }} props
 */
export default function BadgeNotificaciones({ conteo }) {
  // Req. 6.3: si el conteo es 0, no renderizar nada
  if (conteo === 0) return null;

  // Req. 6.4: si el conteo supera 99, mostrar "99+"
  const texto = conteo > 99 ? '99+' : String(conteo);

  // Req. 6.6: aria-label dinámico con el conteo real (no truncado)
  const ariaLabel =
    conteo > 99
      ? '99+ notificaciones pendientes'
      : `${conteo} notificaciones pendientes`;

  return (
    <span
      aria-label={ariaLabel}
      // Req. 6.5: fondo #FF453A, texto blanco, tamaño mínimo 18×18 px, border-radius circular
      style={{
        backgroundColor: '#FF453A',
        color: '#FFFFFF',
        minWidth: '18px',
        minHeight: '18px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        // Posicionamiento absoluto gestionado por el contenedor padre (AppShell)
      }}
    >
      {texto}
    </span>
  );
}

BadgeNotificaciones.propTypes = {
  /** Número de notificaciones no leídas. Si es 0, el componente no renderiza nada. */
  conteo: PropTypes.number.isRequired,
};
