/**
 * Pasos del tour de Configuración del sistema.
 */
export const pasosConfiguracion = [
  {
    popover: {
      title: 'Configuración del sistema',
      description:
        'Aquí ajustas los parámetros globales que afectan a todo el cotizador.',
    },
  },
  {
    element: '[data-tour="config-financieros"]',
    popover: {
      title: 'Parámetros financieros',
      description:
        'Define el margen de ganancia, el IGV y el tipo de cambio. Impactan en todos los precios.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="config-asistente"]',
    popover: {
      title: 'Asistente de IA',
      description:
        'Configura el comportamiento y el modelo del asistente que ayuda a armar cotizaciones.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="config-claves"]',
    popover: {
      title: 'Claves API',
      description:
        'Aquí se guardan las claves de los servicios de IA. Manéjalas con cuidado: son datos sensibles.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosConfiguracion;
