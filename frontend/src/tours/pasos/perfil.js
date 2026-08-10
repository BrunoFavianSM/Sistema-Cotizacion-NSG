/**
 * Pasos del tour de Mi cuenta (Perfil).
 */
export const pasosPerfil = [
  {
    popover: {
      title: 'Tu cuenta',
      description:
        'Desde aquí gestionas tus datos, tu contraseña y el estado de tu cuenta.',
    },
  },
  {
    element: '[data-tour="perfil-datos"]',
    popover: {
      title: 'Datos personales',
      description:
        'Actualiza tu teléfono y tu correo. El nombre solo lo puede cambiar un administrador.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="perfil-password"]',
    popover: {
      title: 'Cambiar contraseña',
      description:
        'Cambia tu contraseña cuando quieras. Necesitarás la actual para confirmar.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="perfil-baja"]',
    popover: {
      title: 'Dar de baja la cuenta',
      description:
        'Si necesitas cerrar tu cuenta, lo haces desde aquí. Es una acción importante, así que pide confirmación.',
      side: 'top',
      align: 'start',
    },
  },
];

export default pasosPerfil;
