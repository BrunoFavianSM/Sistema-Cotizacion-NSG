import { useCallback, useEffect } from 'react';

const CLAVE_STORAGE = 'nsg_cotizador_seleccion';

/**
 * Extrae solo IDs y tablas de la configuración seleccionada para persistir en localStorage.
 * No almacena objetos completos de producto, solo los identificadores necesarios para restaurar.
 *
 * @param {Object} seleccion - configuracionSeleccionada del contexto
 * @returns {Object} snapshot con IDs y tablas
 */
function extraerIDs(seleccion) {
  const snapshot = {};

  const TABLA_POR_CAMPO = {
    procesador:      'productos_procesador',
    placa_madre:     'productos_placa_madre',
    ram:             'productos_ram',
    almacenamiento:  'productos_almacenamiento',
    gpu:             'productos_gpu',
    fuente:          'productos_fuente',
    case:            'productos_case',
  };

  // Campos de componente único
  for (const [campo, tabla] of Object.entries(TABLA_POR_CAMPO)) {
    if (campo === 'ram') continue; // se maneja aparte
    const producto = seleccion[campo];
    if (producto && producto.id != null) {
      snapshot[campo] = { id: producto.id, tabla };
    }
  }

  // RAM: array de productos (puede haber duplicados por cantidad)
  if (Array.isArray(seleccion.ram) && seleccion.ram.length > 0) {
    snapshot.ram = seleccion.ram.map((p) => ({ id: p.id, tabla: 'productos_ram' }));
  }

  return snapshot;
}

/**
 * Valida que el snapshot guardado tenga la estructura esperada.
 * Acepta campos opcionales; solo verifica que los presentes sean objetos con id y tabla.
 *
 * @param {*} guardado - valor parseado de localStorage
 * @returns {boolean}
 */
function esEstructuraValida(guardado) {
  if (typeof guardado !== 'object' || guardado === null || Array.isArray(guardado)) {
    return false;
  }

  const CAMPOS_ARRAY = ['ram', 'extras'];
  const CAMPOS_OBJETO = ['procesador', 'placa_madre', 'almacenamiento', 'gpu', 'fuente', 'case'];

  for (const campo of CAMPOS_OBJETO) {
    if (!(campo in guardado)) continue;
    const val = guardado[campo];
    if (typeof val !== 'object' || val === null || typeof val.id === 'undefined' || !val.tabla) {
      return false;
    }
  }

  for (const campo of CAMPOS_ARRAY) {
    if (!(campo in guardado)) continue;
    if (!Array.isArray(guardado[campo])) return false;
    for (const item of guardado[campo]) {
      if (typeof item !== 'object' || item === null || typeof item.id === 'undefined' || !item.tabla) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Reconstruye la configuración completa buscando los productos por ID en el catálogo.
 * Filtra silenciosamente los productos que ya no existen en el catálogo.
 *
 * @param {Object} snapshot - IDs y tablas guardados
 * @param {Array}  catalogo - array de productos disponibles
 * @returns {Object} configuración restaurada (solo campos con productos encontrados)
 */
function reconstruirSeleccion(snapshot, catalogo) {
  const seleccionRestaurada = {};

  const buscarPorId = (id) => catalogo.find((p) => Number(p.id) === Number(id)) || null;

  const CAMPOS_OBJETO = ['procesador', 'placa_madre', 'almacenamiento', 'gpu', 'fuente', 'case'];

  for (const campo of CAMPOS_OBJETO) {
    if (!snapshot[campo]) continue;
    const producto = buscarPorId(snapshot[campo].id);
    if (producto) {
      seleccionRestaurada[campo] = producto;
    }
  }

  // RAM: reconstruir array (respetando duplicados para cantidad)
  if (Array.isArray(snapshot.ram) && snapshot.ram.length > 0) {
    const ramRestaurada = snapshot.ram
      .map((item) => buscarPorId(item.id))
      .filter(Boolean);
    if (ramRestaurada.length > 0) {
      seleccionRestaurada.ram = ramRestaurada;
    }
  }

  return seleccionRestaurada;
}

/**
 * Hook que persiste y restaura la selección de componentes del cotizador en localStorage.
 *
 * - Solo almacena IDs y tablas (no objetos completos).
 * - Al montar: restaura la selección si el catálogo ya está disponible.
 * - Al cambiar la selección: guarda el snapshot actualizado.
 * - Exporta `limpiarPersistencia` para llamar al generar cotización o limpiar configuración.
 *
 * @param {Object}   seleccion           - configuracionSeleccionada del contexto
 * @param {Function} setSeleccion        - setConfiguracionSeleccionada del contexto
 * @param {Array}    productosDisponibles - array de productos del catálogo
 * @returns {{ limpiarPersistencia: Function }}
 */
function usePersistenciaSeleccion(seleccion, setSeleccion, productosDisponibles) {
  // ── Restauración al montar (cuando el catálogo está disponible) ──────────
  useEffect(() => {
    // Esperar a que el catálogo esté cargado
    if (!Array.isArray(productosDisponibles) || productosDisponibles.length === 0) return;

    try {
      const raw = localStorage.getItem(CLAVE_STORAGE);
      if (!raw) return;

      const guardado = JSON.parse(raw);

      if (!esEstructuraValida(guardado)) {
        localStorage.removeItem(CLAVE_STORAGE);
        return;
      }

      const seleccionRestaurada = reconstruirSeleccion(guardado, productosDisponibles);

      // Solo restaurar si hay al menos un componente encontrado
      if (Object.keys(seleccionRestaurada).length === 0) return;

      setSeleccion((prev) => ({
        ...prev,
        ...seleccionRestaurada,
      }));
    } catch {
      // JSON corrupto u otro error: limpiar silenciosamente
      localStorage.removeItem(CLAVE_STORAGE);
    }
  }, [productosDisponibles]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persistencia cuando la selección cambia ──────────────────────────────
  useEffect(() => {
    if (!seleccion) return;

    // Verificar si hay algo seleccionado
    const haySeleccion =
      Object.entries(seleccion).some(([, valor]) => {
        if (Array.isArray(valor)) return valor.length > 0;
        return valor !== null && valor !== undefined;
      });

    if (!haySeleccion) return;

    const snapshot = extraerIDs(seleccion);
    if (Object.keys(snapshot).length === 0) return;

    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(snapshot));
  }, [seleccion]);

  // ── Limpieza explícita ───────────────────────────────────────────────────
  const limpiarPersistencia = useCallback(() => {
    localStorage.removeItem(CLAVE_STORAGE);
  }, []);

  return { limpiarPersistencia };
}

export default usePersistenciaSeleccion;
