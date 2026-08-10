/**
 * Hook que conecta el registro de tours con la UI.
 *
 * Responsabilidades:
 *  - Resolver el tour de la ruta actual.
 *  - Exponer si hay tour disponible (para mostrar el botón de ayuda).
 *  - Lanzar el tour manualmente (botón "?") o automáticamente en la primera
 *    visita, según `autoIniciar`.
 *  - Recordar en localStorage que el tour ya se vio para no repetirlo solo.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { crearTour } from './driver.config';
import { obtenerTourPorRuta } from './registroTours';
import { pasoVolverAVer } from './pasos/comun';

const PREFIJO_STORAGE = 'cotizador-tour-visto';
/** Margen para que la página termine de renderizar antes del auto-inicio. */
const RETARDO_AUTO_INICIO_MS = 600;

/**
 * Construye la clave de localStorage para un tour.
 * @param {string} clave
 * @returns {string}
 */
function claveStorage(clave) {
  return `${PREFIJO_STORAGE}:${clave}`;
}

/**
 * @param {string} clave
 * @returns {boolean}
 */
export function tourYaVisto(clave) {
  try {
    return localStorage.getItem(claveStorage(clave)) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {string} clave
 */
export function marcarTourVisto(clave) {
  try {
    localStorage.setItem(claveStorage(clave), '1');
  } catch {
    /* localStorage no disponible (modo privado): el tour simplemente no se recuerda. */
  }
}

/**
 * @returns {{ tourDisponible: boolean, lanzarTour: () => void }}
 */
export function useTour() {
  const { pathname } = useLocation();
  const definicion = useMemo(() => obtenerTourPorRuta(pathname), [pathname]);
  const instanciaRef = useRef(null);
  const autoIntentadoRef = useRef(null);

  const lanzarTour = useCallback(() => {
    if (!definicion) return;

    // Cerrar cualquier tour previo antes de abrir otro.
    if (instanciaRef.current) {
      instanciaRef.current.destroy();
      instanciaRef.current = null;
    }

    const instancia = crearTour({
      pasos: [...definicion.pasos, pasoVolverAVer],
      onFinalizar: () => {
        marcarTourVisto(definicion.clave);
        instanciaRef.current = null;
      },
    });

    instanciaRef.current = instancia;
    instancia.drive();
  }, [definicion]);

  // Auto-inicio en la primera visita de una ruta con autoIniciar.
  useEffect(() => {
    if (!definicion || !definicion.autoIniciar) return undefined;
    // Evita relanzar por el doble render de StrictMode o navegaciones repetidas.
    if (autoIntentadoRef.current === definicion.clave) return undefined;
    autoIntentadoRef.current = definicion.clave;

    if (tourYaVisto(definicion.clave)) return undefined;

    const id = setTimeout(() => {
      lanzarTour();
    }, RETARDO_AUTO_INICIO_MS);

    return () => clearTimeout(id);
  }, [definicion, lanzarTour]);

  // Limpieza: cerrar el tour al desmontar o cambiar de ruta.
  useEffect(() => {
    return () => {
      if (instanciaRef.current) {
        instanciaRef.current.destroy();
        instanciaRef.current = null;
      }
    };
  }, [pathname]);

  return {
    tourDisponible: Boolean(definicion),
    lanzarTour,
  };
}

export default useTour;
