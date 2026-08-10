/**
 * Pasos del tour de Gestión de productos.
 * La lista detallada solo existe en la vista detallada; ese paso se descarta en
 * la vista de tabla.
 */
export const pasosProductos = [
  {
    popover: {
      title: 'Gestión de productos',
      description:
        'Aquí administras el catálogo: stock, precios y disponibilidad de cada producto.',
    },
  },
  {
    element: '[data-tour="productos-nuevo"]',
    popover: {
      title: 'Agregar un producto',
      description:
        'Con este botón creas un producto nuevo y completas sus datos en un formulario.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="productos-lista"]',
    popover: {
      title: 'Catálogo',
      description:
        'Aquí aparecen tus productos. Puedes filtrarlos por categoría y estado, y editar cada uno.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosProductos;
