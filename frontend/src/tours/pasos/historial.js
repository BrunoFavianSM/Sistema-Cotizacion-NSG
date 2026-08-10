/**
 * Pasos del tour de Historial de cotizaciones.
 * Algunos elementos dependen del rol (admin/vendedor ven búsqueda y lista de
 * clientes; el cliente ve directamente sus cotizaciones). Los pasos cuyo
 * elemento no esté en pantalla se descartan automáticamente.
 */
export const pasosHistorial = [
  {
    popover: {
      title: 'Historial de cotizaciones',
      description:
        'Aquí consultas las cotizaciones ya emitidas: puedes revisarlas y descargar sus documentos.',
    },
  },
  {
    element: '[data-tour="historial-buscar"]',
    popover: {
      title: 'Busca por correo',
      description:
        'Ingresa el correo del cliente para traer todas sus cotizaciones registradas.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="historial-clientes"]',
    popover: {
      title: 'Clientes registrados',
      description:
        'Haz clic en un cliente de la lista para ver su historial sin tener que escribir el correo.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="historial-resumen"]',
    popover: {
      title: 'Resumen del cliente',
      description:
        'Aquí ves un resumen: cantidad de cotizaciones y monto acumulado. Más abajo está el detalle de cada una.',
      side: 'bottom',
      align: 'start',
    },
  },
];

export default pasosHistorial;
