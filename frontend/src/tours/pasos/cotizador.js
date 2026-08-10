/**
 * Pasos del tour del Cotizador.
 *
 * Los selectores apuntan a atributos `data-tour` colocados en la página, no a
 * clases de Tailwind (que cambian con cada ajuste de diseño). Cada paso explica
 * una zona de la pantalla en lenguaje claro y directo.
 *
 * El primer paso es un popover centrado de bienvenida (sin `element`).
 */
export const pasosCotizador = [
  {
    popover: {
      title: 'Te damos la bienvenida',
      description:
        'Este es el cotizador. En unos pocos pasos armarás una computadora completa y obtendrás su precio. Te mostramos lo principal. Si no quieres verlo ahora, puedes omitirlo.',
    },
  },
  {
    element: '[data-tour="cotizador-pasos"]',
    popover: {
      title: 'Arma tu PC por pasos',
      description:
        'Cada casilla es una pieza: procesador, placa, memoria, etc. Completa una y avanza a la siguiente. Las que ya elegiste quedan marcadas en verde.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-productos"]',
    popover: {
      title: 'Elige cada componente',
      description:
        'Aquí aparecen los productos del paso actual con su precio y stock. Haz clic en uno para agregarlo a tu configuración.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-asistente"]',
    popover: {
      title: '¿No sabes qué elegir?',
      description:
        'Cuéntale al asistente para qué usarás la PC y tu presupuesto. Te sugiere una configuración completa que puedes aplicar con un clic.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-cliente"]',
    popover: {
      title: 'Datos del cliente',
      description:
        'Completa los datos de contacto. Son necesarios para emitir la cotización y poder enviártela.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cotizador-generar"]',
    popover: {
      title: 'Genera tu cotización',
      description:
        'Cuando tengas todos los componentes elegidos, este botón crea la cotización con el total final. ¡Listo!',
      side: 'left',
      align: 'start',
    },
  },
];

export default pasosCotizador;
