/**
 * Pasos del tour de Gestión de cuentas (admin-usuarios).
 */
export const pasosUsuarios = [
  {
    popover: {
      title: 'Gestión de cuentas',
      description:
        'Aquí administras las cuentas del sistema: administradores, vendedores y usuarios.',
    },
  },
  {
    element: '[data-tour="usuarios-nueva"]',
    popover: {
      title: 'Crear una cuenta',
      description:
        'Con este botón creas una cuenta nueva y le asignas su rol.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="usuarios-lista"]',
    popover: {
      title: 'Listado de cuentas',
      description:
        'Aquí ves todas las cuentas. Desde cada fila puedes editar sus datos o cambiar su estado.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosUsuarios;
