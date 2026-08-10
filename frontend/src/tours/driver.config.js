/**
 * Fábrica de instancias de tour basada en driver.js.
 *
 * Centraliza la configuración común (textos en español, tema, accesibilidad)
 * para que cada tour solo tenga que aportar sus pasos. Expone además la
 * inyección del botón "Saltar tour" solicitado por el equipo.
 */
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tours.css';

const TEXTO_SALTAR = 'Saltar tour';

/**
 * Indica si el usuario pidió reducir el movimiento (accesibilidad).
 * @returns {boolean}
 */
function prefiereMovimientoReducido() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Filtra los pasos cuyo elemento ancla no existe en el DOM al momento de
 * iniciar el tour. Los pasos sin `element` (popover centrado) se conservan
 * siempre. Esto hace que un mismo tour sea robusto entre roles (admin,
 * usuario, invitado), donde algunos elementos pueden no renderizarse.
 *
 * @param {Array<object>} pasos
 * @returns {Array<object>}
 */
export function filtrarPasosVisibles(pasos = []) {
  if (typeof document === 'undefined') return pasos;
  return pasos.filter((paso) => {
    if (!paso || !paso.element) return true;
    if (typeof paso.element !== 'string') return true;
    return document.querySelector(paso.element) !== null;
  });
}

/**
 * Crea una instancia de driver.js lista para `.drive()`.
 *
 * @param {object} opciones
 * @param {Array<object>} opciones.pasos - Pasos del tour (formato driver.js).
 * @param {() => void} [opciones.onFinalizar] - Se llama al completar o cerrar el tour.
 * @param {boolean} [opciones.mostrarBotonSaltar=true] - Inyecta el botón "Saltar tour".
 * @returns {import('driver.js').Driver}
 */
export function crearTour({ pasos, onFinalizar, mostrarBotonSaltar = true }) {
  const pasosVisibles = filtrarPasosVisibles(pasos);

  const instancia = driver({
    showProgress: pasosVisibles.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    popoverClass: 'tour-nsg',
    animate: !prefiereMovimientoReducido(),
    allowClose: true,
    overlayClickBehavior: 'close',
    steps: pasosVisibles,
    onPopoverRender: mostrarBotonSaltar
      ? (popover) => inyectarBotonSaltar(popover, instancia)
      : undefined,
    onDestroyed: () => {
      if (typeof onFinalizar === 'function') onFinalizar();
    },
  });

  return instancia;
}

/**
 * Inyecta un botón "Saltar tour" al inicio del grupo de navegación del popover.
 * Al pulsarlo se cierra el tour por completo (lo que dispara onDestroyed y
 * marca el tour como visto). El layout del pie (botones en una fila y el texto
 * de progreso debajo) se resuelve por completo en tours.css.
 *
 * @param {object} popover - Objeto popover entregado por driver.js.
 * @param {import('driver.js').Driver} instancia
 */
function inyectarBotonSaltar(popover, instancia) {
  if (!popover || !popover.footerButtons) return;
  if (popover.footerButtons.querySelector('.tour-nsg-skip-btn')) return;

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tour-nsg-skip-btn';
  boton.textContent = TEXTO_SALTAR;
  boton.setAttribute('aria-label', TEXTO_SALTAR);
  boton.addEventListener('click', () => instancia.destroy());

  popover.footerButtons.prepend(boton);
}
