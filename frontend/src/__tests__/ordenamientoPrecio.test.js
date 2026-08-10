/**
 * Tests de propiedades — ordenarProductos
 *
 * Valida las propiedades de ordenamiento de la función `ordenarProductos`
 * definida en Cotizador.jsx. La función se copia aquí para testearla de
 * forma aislada sin necesidad de montar el componente completo.
 *
 * Validates: Requisitos 10.6, 10.7, 10.8
 */

import * as fc from 'fast-check';

// ── Función bajo prueba ────────────────────────────────────────────────────
// Copia fiel de la función definida en frontend/src/paginas/Cotizador.jsx.
// Si la implementación cambia allá, actualizar aquí también.
/**
 * Ordena una lista de productos por precio_base.
 * Función pura: no modifica la lista original.
 * @param {Array} productos
 * @param {'relevancia'|'menor'|'mayor'} orden
 * @returns {Array}
 */
function ordenarProductos(productos, orden) {
  if (orden === 'relevancia') return productos;
  return [...productos].sort((a, b) =>
    orden === 'menor'
      ? a.precio_base - b.precio_base
      : b.precio_base - a.precio_base
  );
}

// ── Generadores ────────────────────────────────────────────────────────────
const productoArbitrario = fc.record({
  id: fc.integer(),
  precio_base: fc.float({ min: 0, max: 100000 }),
});

const listaProductos = fc.array(productoArbitrario, {
  minLength: 0,
  maxLength: 50,
});

// ── Property 6: Ordenamiento ascendente correcto ───────────────────────────
// Validates: Requisito 10.7
describe('Property 6 — Ordenamiento ascendente correcto', () => {
  test('ordenarProductos(lista, "menor") produce lista con precio_base no decreciente', () => {
    fc.assert(
      fc.property(listaProductos, (lista) => {
        const resultado = ordenarProductos(lista, 'menor');

        for (let i = 0; i < resultado.length - 1; i++) {
          if (resultado[i].precio_base > resultado[i + 1].precio_base) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 7: Ordenamiento descendente correcto ─────────────────────────
// Validates: Requisito 10.8
describe('Property 7 — Ordenamiento descendente correcto', () => {
  test('ordenarProductos(lista, "mayor") produce lista con precio_base no creciente', () => {
    fc.assert(
      fc.property(listaProductos, (lista) => {
        const resultado = ordenarProductos(lista, 'mayor');

        for (let i = 0; i < resultado.length - 1; i++) {
          if (resultado[i].precio_base < resultado[i + 1].precio_base) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 8: Ordenamiento no elimina productos ─────────────────────────
// Validates: Requisito 10.6
describe('Property 8 — Ordenamiento no elimina productos', () => {
  test('para cualquier modo, la lista resultante tiene exactamente N elementos', () => {
    fc.assert(
      fc.property(
        listaProductos,
        fc.constantFrom('relevancia', 'menor', 'mayor'),
        (lista, modo) => {
          const resultado = ordenarProductos(lista, modo);
          return resultado.length === lista.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
