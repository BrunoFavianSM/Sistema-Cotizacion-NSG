/**
 * Hook useComparador
 *
 * Gestiona la lista de hasta 3 productos para comparar en el cotizador.
 * Expone métodos para agregar, quitar y limpiar la lista, y un flag de error
 * cuando se intenta superar el límite de 3 productos.
 *
 * Valida Requisitos: 6.3, 6.4
 */

import { useCallback, useState } from 'react';

const LIMITE_COMPARADOR = 3;

/**
 * @typedef {Object} EstadoComparador
 * @property {Array<Object>} productosComparar - Lista de productos en comparación (máx. 3).
 * @property {string|null} errorLimite - Mensaje de error cuando se supera el límite, o null.
 * @property {(producto: Object) => void} agregarAComparador - Agrega un producto a la lista.
 * @property {(idProducto: number) => void} quitarDeComparador - Quita un producto por ID.
 * @property {() => void} limpiarComparador - Vacía la lista de comparación.
 */

/**
 * @returns {EstadoComparador}
 */
export function useComparador() {
  const [productosComparar, setProductosComparar] = useState([]);
  const [errorLimite, setErrorLimite] = useState(null);

  /**
   * Agrega un producto a la lista de comparación.
   * Si el producto ya está en la lista, no hace nada.
   * Si se alcanza el límite de 3, establece un mensaje de error.
   *
   * @param {Object} producto - Producto a agregar.
   */
  const agregarAComparador = useCallback((producto) => {
    setProductosComparar((prev) => {
      // Ya está en la lista: no duplicar
      if (prev.some((p) => p.id === producto.id)) {
        return prev;
      }

      // Límite alcanzado
      if (prev.length >= LIMITE_COMPARADOR) {
        setErrorLimite(
          `Solo puedes comparar hasta ${LIMITE_COMPARADOR} productos a la vez. Quita uno antes de agregar otro.`
        );
        return prev;
      }

      // Limpiar error previo al agregar exitosamente
      setErrorLimite(null);
      return [...prev, producto];
    });
  }, []);

  /**
   * Quita un producto de la lista de comparación por su ID.
   * También limpia el error de límite si existía.
   *
   * @param {number} idProducto
   */
  const quitarDeComparador = useCallback((idProducto) => {
    setProductosComparar((prev) => prev.filter((p) => p.id !== idProducto));
    setErrorLimite(null);
  }, []);

  /**
   * Vacía completamente la lista de comparación y limpia errores.
   */
  const limpiarComparador = useCallback(() => {
    setProductosComparar([]);
    setErrorLimite(null);
  }, []);

  return {
    productosComparar,
    errorLimite,
    agregarAComparador,
    quitarDeComparador,
    limpiarComparador,
  };
}

export default useComparador;
