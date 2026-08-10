/**
 * Registro central de tours por ruta.
 *
 * Mapea cada `pathname` a la definición de su tour. El AppShell usa
 * `obtenerTourPorRuta` para decidir si mostrar el botón de ayuda y qué pasos
 * lanzar. Centralizar el mapa evita repetir lógica en cada página.
 *
 * Cada entrada tiene:
 *  - clave: identificador estable usado para el flag de "visto" en localStorage.
 *  - pasos: arreglo de pasos en formato driver.js.
 *  - autoIniciar: si el tour se dispara solo en la primera visita.
 *  - coincide: predicado sobre el pathname.
 */
import { pasosCotizador } from './pasos/cotizador';
import { pasosHistorial } from './pasos/historial';
import { pasosPerfil } from './pasos/perfil';
import { pasosValidar } from './pasos/validar';
import { pasosProductos } from './pasos/productos';
import { pasosUsuarios } from './pasos/usuarios';
import { pasosConfiguracion } from './pasos/configuracion';
import { pasosImportarCsv } from './pasos/importar-csv';

/**
 * @typedef {object} DefinicionTour
 * @property {string} clave
 * @property {Array<object>} pasos
 * @property {boolean} autoIniciar
 * @property {(pathname: string) => boolean} coincide
 */

/** @type {DefinicionTour[]} */
export const TOURS = [
  {
    clave: 'cotizador',
    pasos: pasosCotizador,
    autoIniciar: true,
    coincide: (pathname) => pathname === '/' || pathname === '/cotizador',
  },
  {
    clave: 'historial',
    pasos: pasosHistorial,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/historial',
  },
  {
    clave: 'perfil',
    pasos: pasosPerfil,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/perfil',
  },
  {
    clave: 'validar',
    pasos: pasosValidar,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/validar',
  },
  {
    clave: 'productos',
    pasos: pasosProductos,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/admin/productos' || pathname === '/admin',
  },
  {
    clave: 'usuarios',
    pasos: pasosUsuarios,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/admin/usuarios',
  },
  {
    clave: 'configuracion',
    pasos: pasosConfiguracion,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/admin/configuracion',
  },
  {
    clave: 'importar-csv',
    pasos: pasosImportarCsv,
    autoIniciar: false,
    coincide: (pathname) => pathname === '/admin/importar-csv',
  },
];

/**
 * Devuelve la definición de tour que corresponde a una ruta, o null.
 * @param {string} pathname
 * @returns {DefinicionTour | null}
 */
export function obtenerTourPorRuta(pathname) {
  return TOURS.find((tour) => tour.coincide(pathname)) || null;
}

export default TOURS;
