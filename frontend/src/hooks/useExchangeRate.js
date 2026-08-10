import { useState, useEffect, useCallback, useRef } from 'react';
import { obtenerTipoCambioAutomatico } from '../servicios/api';

const CLAVE_CACHE = 'nsg_tipo_cambio_cache';
const TTL_CACHE_MS = 86_400_000; // 24 horas

/**
 * Hook para gestionar el tipo de cambio USD/PEN.
 * Soporta modo manual (valor de BD) y automático (API externa con caché 24h).
 *
 * @param {object} opciones
 * @param {'manual'|'automatico'} opciones.modo        - Modo activo
 * @param {number}                opciones.valorManual  - Tipo de cambio manual desde BD (respaldo)
 * @returns {{
 *   tipoCambio: number,
 *   cargando: boolean,
 *   error: string | null,
 *   advertencia: string | null,
 *   ultimaActualizacion: Date | null,
 *   forzarActualizacion: () => Promise<void>
 * }}
 */
export function useExchangeRate({ modo, valorManual }) {
  const [tipoCambio, setTipoCambio] = useState(valorManual ?? 0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [advertencia, setAdvertencia] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Ref para evitar actualizaciones de estado en componentes desmontados
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // --- Helpers de caché ---

  const leerCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(CLAVE_CACHE);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (
        typeof cache.valor === 'number' &&
        typeof cache.timestamp === 'number'
      ) {
        return cache;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const escribirCache = useCallback((valor, fecha) => {
    try {
      const entrada = {
        valor,
        timestamp: Date.now(),
        fuente: 'automatico',
        fecha: fecha ?? new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(CLAVE_CACHE, JSON.stringify(entrada));
    } catch {
      // localStorage puede estar bloqueado (modo privado, cuota llena)
    }
  }, []);

  const invalidarCache = useCallback(() => {
    try {
      localStorage.removeItem(CLAVE_CACHE);
    } catch {
      // ignorar
    }
  }, []);

  // --- Lógica de obtención automática ---

  const obtenerDesdeProxy = useCallback(async () => {
    if (!montadoRef.current) return;
    setCargando(true);
    setError(null);
    setAdvertencia(null);

    try {
      const respuesta = await obtenerTipoCambioAutomatico();
      if (!montadoRef.current) return;

      const valor = respuesta.tipo_cambio;
      escribirCache(valor, respuesta.fecha);
      setTipoCambio(valor);
      setUltimaActualizacion(new Date());
    } catch (err) {
      if (!montadoRef.current) return;

      // Intentar usar caché aunque esté expirada
      const cache = leerCache();
      if (cache) {
        setTipoCambio(cache.valor);
        setUltimaActualizacion(new Date(cache.timestamp));
        setAdvertencia(
          'No se pudo actualizar el tipo de cambio. Se está usando el último valor en caché, que puede estar desactualizado.'
        );
      } else {
        // Último recurso: valor manual de BD
        setTipoCambio(valorManual ?? 0);
        setAdvertencia(
          'No se pudo obtener el tipo de cambio automático y no hay caché disponible. Se está usando el valor de respaldo configurado manualmente.'
        );
        setError(err?.mensaje ?? 'Error al obtener el tipo de cambio automático.');
      }
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, [escribirCache, leerCache, valorManual]);

  // --- Efecto principal ---

  useEffect(() => {
    if (modo === 'manual') {
      // Modo manual: usar directamente el valor de BD, sin llamadas externas
      setTipoCambio(valorManual ?? 0);
      setCargando(false);
      setError(null);
      setAdvertencia(null);
      setUltimaActualizacion(null);
      return;
    }

    // Modo automático: verificar caché primero
    const cache = leerCache();
    const cacheValida = cache && (Date.now() - cache.timestamp < TTL_CACHE_MS);

    if (cacheValida) {
      setTipoCambio(cache.valor);
      setUltimaActualizacion(new Date(cache.timestamp));
      setCargando(false);
      setError(null);
      setAdvertencia(null);
    } else {
      obtenerDesdeProxy();
    }
  }, [modo, valorManual, leerCache, obtenerDesdeProxy]);

  // --- forzarActualizacion ---

  const forzarActualizacion = useCallback(async () => {
    invalidarCache();
    await obtenerDesdeProxy();
  }, [invalidarCache, obtenerDesdeProxy]);

  return {
    tipoCambio,
    cargando,
    error,
    advertencia,
    ultimaActualizacion,
    forzarActualizacion,
  };
}
