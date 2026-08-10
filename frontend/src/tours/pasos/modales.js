/**
 * Pasos de los mini-tours de modales.
 *
 * Estos tours se lanzan a demanda desde el botón de ayuda del propio modal
 * (ver componentes/ui/Modal.jsx, prop `pasosTour`). Explican los campos o
 * acciones que solo aparecen una vez que el modal está abierto.
 */

/** Modal de crear/editar cuenta (admin-usuarios). */
export const pasosModalUsuario = [
  {
    popover: {
      title: 'Crear o editar una cuenta',
      description:
        'Completa los datos de la persona. Te marcamos los dos campos más importantes.',
    },
  },
  {
    element: '[data-tour="modal-usuario-rol"]',
    popover: {
      title: 'Rol de la cuenta',
      description:
        'El rol define qué puede hacer: administrador, vendedor o usuario. Elígelo con cuidado.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="modal-usuario-password"]',
    popover: {
      title: 'Contraseña',
      description:
        'Al crear la cuenta, define una contraseña de al menos 8 caracteres. Al editar, déjala vacía si no quieres cambiarla.',
      side: 'top',
      align: 'start',
    },
  },
];

/** Modal de crear/editar producto (admin-productos). */
export const pasosModalProducto = [
  {
    popover: {
      title: 'Crear o editar un producto',
      description:
        'Carga los datos del producto. Te señalamos lo esencial para que aparezca bien en el cotizador.',
    },
  },
  {
    element: '[data-tour="modal-producto-basicos"]',
    popover: {
      title: 'Datos básicos',
      description:
        'Nombre y categoría definen qué es el producto y en qué paso del cotizador aparece.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="modal-producto-comercial"]',
    popover: {
      title: 'Precio y stock',
      description:
        'El precio y la disponibilidad determinan cómo se ofrece el producto al cliente.',
      side: 'top',
      align: 'start',
    },
  },
];

/** Modal de dar de baja la cuenta (perfil). */
export const pasosModalBaja = [
  {
    popover: {
      title: 'Dar de baja la cuenta',
      description:
        'Esta acción desactiva tu cuenta. Para confirmarla necesitas ingresar tu contraseña actual.',
    },
  },
  {
    element: '[data-tour="modal-baja-password"]',
    popover: {
      title: 'Confirma con tu contraseña',
      description:
        'Ingresa tu contraseña para confirmar. Es una medida de seguridad para evitar bajas accidentales.',
      side: 'top',
      align: 'start',
    },
  },
];
