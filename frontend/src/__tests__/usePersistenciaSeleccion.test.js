/**
 * Tests — usePersistenciaSeleccion hook
 *
 * Cubre:
 *   - Property 5: Persistencia round-trip de selección (fast-check, 100 iteraciones)
 *   - Test: JSON corrupto en localStorage → selección vacía sin error
 *   - Test: limpiarPersistencia → localStorage vacío
 *
 * Validates: Requisito 3.1, 3.2, 3.4
 */

import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import usePersistenciaSeleccion from '../hooks/usePersistenciaSeleccion';

// ─── Constantes ──────────────────────────────────────────────────────────────

const CLAVE_STORAGE = 'nsg_cotizador_seleccion';

// Tablas esperadas por campo (deben coincidir con extraerIDs del hook)
const TABLA_POR_CAMPO = {
  procesador:     'productos_procesador',
  placa_madre:    'productos_placa_madre',
  almacenamiento: 'productos_almacenamiento',
  gpu:            'productos_gpu',
  fuente:         'productos_fuente',
  case:           'productos_case',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construye un objeto de producto mínimo a partir de un id.
 * El hook solo necesita { id } para extraerIDs; el catálogo necesita { id } para reconstruirSeleccion.
 */
function makeProducto(id) {
  return { id, nombre: `Producto ${id}`, precio_base: 100 };
}

/**
 * Construye el catálogo de productos a partir de una selección generada por fast-check.
 * Incluye todos los productos referenciados para que reconstruirSeleccion los encuentre.
 */
function buildCatalogo(seleccion) {
  const productos = [];
  const seen = new Set();

  const add = (id) => {
    if (id != null && !seen.has(id)) {
      seen.add(id);
      productos.push(makeProducto(id));
    }
  };

  for (const campo of Object.keys(TABLA_POR_CAMPO)) {
    if (seleccion[campo]) add(seleccion[campo].id);
  }
  if (Array.isArray(seleccion.ram)) {
    seleccion.ram.forEach((p) => add(p.id));
  }

  return productos;
}

/**
 * Extrae IDs y tablas de la selección, replicando la lógica de extraerIDs del hook.
 * Se usa para construir el snapshot esperado en la property.
 */
function extraerIDsEsperado(seleccion) {
  const snapshot = {};

  for (const [campo, tabla] of Object.entries(TABLA_POR_CAMPO)) {
    const producto = seleccion[campo];
    if (producto && producto.id != null) {
      snapshot[campo] = { id: producto.id, tabla };
    }
  }

  if (Array.isArray(seleccion.ram) && seleccion.ram.length > 0) {
    snapshot.ram = seleccion.ram.map((p) => ({ id: p.id, tabla: 'productos_ram' }));
  }

  return snapshot;
}

// ─── Arbitrarios fast-check ───────────────────────────────────────────────────

/** Componente único con id válido */
const componenteArb = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
});

/** Selección completa con los 7 campos de componentes (todos opcionales) */
const seleccionArb = fc.record(
  {
    procesador:     fc.option(componenteArb, { nil: undefined }),
    placa_madre:    fc.option(componenteArb, { nil: undefined }),
    almacenamiento: fc.option(componenteArb, { nil: undefined }),
    gpu:            fc.option(componenteArb, { nil: undefined }),
    fuente:         fc.option(componenteArb, { nil: undefined }),
    case:           fc.option(componenteArb, { nil: undefined }),
    ram:            fc.option(
      fc.array(componenteArb, { minLength: 1, maxLength: 4 }),
      { nil: undefined }
    ),
  },
  { requiredKeys: [] }
);

/** Selección con al menos un componente seleccionado (para que el hook persista algo) */
const seleccionConDatosArb = seleccionArb.filter((s) => {
  const tieneComponente = Object.keys(TABLA_POR_CAMPO).some((c) => s[c] != null);
  const tieneRam = Array.isArray(s.ram) && s.ram.length > 0;
  return tieneComponente || tieneRam;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePersistenciaSeleccion', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Property 5: Persistencia round-trip ─────────────────────────────────────
  /**
   * **Validates: Requisito 3.1, 3.2**
   *
   * Para cualquier selección con IDs válidos, serializar con JSON.stringify(extraerIDs(seleccion))
   * y deserializar con JSON.parse produce una selección equivalente (mismos IDs y tablas).
   */
  test('Property 5: round-trip de serialización produce IDs y tablas equivalentes', () => {
    fc.assert(
      fc.property(seleccionConDatosArb, (seleccion) => {
        // Calcular el snapshot esperado (lo que el hook guardaría)
        const snapshotEsperado = extraerIDsEsperado(seleccion);

        // Serializar y deserializar (round-trip)
        const serializado = JSON.stringify(snapshotEsperado);
        const deserializado = JSON.parse(serializado);

        // Verificar campos de componente único
        for (const [campo, tabla] of Object.entries(TABLA_POR_CAMPO)) {
          if (snapshotEsperado[campo]) {
            expect(deserializado[campo]).toBeDefined();
            expect(deserializado[campo].id).toBe(snapshotEsperado[campo].id);
            expect(deserializado[campo].tabla).toBe(tabla);
          } else {
            expect(deserializado[campo]).toBeUndefined();
          }
        }

        // Verificar RAM (array)
        if (snapshotEsperado.ram) {
          expect(Array.isArray(deserializado.ram)).toBe(true);
          expect(deserializado.ram.length).toBe(snapshotEsperado.ram.length);
          deserializado.ram.forEach((item, i) => {
            expect(item.id).toBe(snapshotEsperado.ram[i].id);
            expect(item.tabla).toBe('productos_ram');
          });
        } else {
          expect(deserializado.ram).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── Property 5 (integración con hook): el hook persiste y restaura correctamente ──
  /**
   * **Validates: Requisito 3.1, 3.2**
   *
   * El hook guarda en localStorage solo IDs y tablas; al deserializar el valor guardado
   * se obtienen los mismos IDs que tenía la selección original.
   */
  test('Property 5 (hook): lo que el hook guarda en localStorage tiene los IDs correctos', () => {
    fc.assert(
      fc.property(seleccionConDatosArb, (seleccion) => {
        localStorage.clear();

        const setSeleccionMock = jest.fn();
        const catalogo = buildCatalogo(seleccion);

        // Renderizar el hook con la selección generada
        renderHook(() =>
          usePersistenciaSeleccion(seleccion, setSeleccionMock, catalogo)
        );

        // Leer lo que el hook guardó en localStorage
        const raw = localStorage.getItem(CLAVE_STORAGE);

        // Si hay algo seleccionado, debe haberse guardado
        const snapshotEsperado = extraerIDsEsperado(seleccion);
        if (Object.keys(snapshotEsperado).length > 0) {
          expect(raw).not.toBeNull();
          const guardado = JSON.parse(raw);

          // Verificar campos de componente único
          for (const [campo, tabla] of Object.entries(TABLA_POR_CAMPO)) {
            if (snapshotEsperado[campo]) {
              expect(guardado[campo]).toBeDefined();
              expect(guardado[campo].id).toBe(snapshotEsperado[campo].id);
              expect(guardado[campo].tabla).toBe(tabla);
            }
          }

          // Verificar RAM
          if (snapshotEsperado.ram) {
            expect(Array.isArray(guardado.ram)).toBe(true);
            guardado.ram.forEach((item, i) => {
              expect(item.id).toBe(snapshotEsperado.ram[i].id);
              expect(item.tabla).toBe('productos_ram');
            });
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // ── Test: JSON corrupto → selección vacía sin error ──────────────────────────
  test('JSON corrupto en localStorage → no llama setSeleccion con datos inválidos y limpia la clave', () => {
    // Guardar JSON con estructura inválida: campo conocido con formato incorrecto
    // (procesador existe pero no tiene id ni tabla → esEstructuraValida retorna false)
    localStorage.setItem(CLAVE_STORAGE, '{"procesador": "invalido_no_es_objeto"}');

    const setSeleccionMock = jest.fn();
    // Catálogo con al menos un producto para que el useEffect de restauración se ejecute
    const catalogo = [makeProducto(1)];

    renderHook(() =>
      usePersistenciaSeleccion({}, setSeleccionMock, catalogo)
    );

    // El hook detecta estructura inválida → no debe llamar setSeleccion con datos corruptos
    // (puede no llamarlo en absoluto, o llamarlo solo con datos válidos)
    const llamadasConDatos = setSeleccionMock.mock.calls.filter((args) => {
      const arg = args[0];
      if (typeof arg === 'function') return false; // updater funcional vacío es OK
      return arg && Object.keys(arg).length > 0;
    });
    expect(llamadasConDatos.length).toBe(0);

    // La clave debe haber sido eliminada de localStorage
    expect(localStorage.getItem(CLAVE_STORAGE)).toBeNull();
  });

  test('JSON completamente inválido (no parseable) → limpia localStorage sin lanzar error', () => {
    localStorage.setItem(CLAVE_STORAGE, 'esto_no_es_json{{{');

    const setSeleccionMock = jest.fn();
    const catalogo = [makeProducto(1)];

    // No debe lanzar excepción
    expect(() => {
      renderHook(() =>
        usePersistenciaSeleccion({}, setSeleccionMock, catalogo)
      );
    }).not.toThrow();

    // La clave debe haber sido eliminada
    expect(localStorage.getItem(CLAVE_STORAGE)).toBeNull();
  });

  // ── Test: limpiarPersistencia → localStorage vacío ───────────────────────────
  test('limpiarPersistencia elimina la clave nsg_cotizador_seleccion de localStorage', () => {
    // Guardar datos válidos en localStorage
    const snapshotValido = {
      procesador: { id: 42, tabla: 'productos_procesador' },
      ram: [{ id: 8, tabla: 'productos_ram' }],
    };
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(snapshotValido));

    const setSeleccionMock = jest.fn();
    const catalogo = [makeProducto(42), makeProducto(8)];

    const { result } = renderHook(() =>
      usePersistenciaSeleccion({}, setSeleccionMock, catalogo)
    );

    // Verificar que la clave existe antes de limpiar
    expect(localStorage.getItem(CLAVE_STORAGE)).not.toBeNull();

    // Llamar a limpiarPersistencia
    act(() => {
      result.current.limpiarPersistencia();
    });

    // La clave debe haber sido eliminada
    expect(localStorage.getItem(CLAVE_STORAGE)).toBeNull();
  });

  test('limpiarPersistencia no lanza error si localStorage ya está vacío', () => {
    localStorage.clear();

    const setSeleccionMock = jest.fn();
    const { result } = renderHook(() =>
      usePersistenciaSeleccion({}, setSeleccionMock, [])
    );

    expect(() => {
      act(() => {
        result.current.limpiarPersistencia();
      });
    }).not.toThrow();

    expect(localStorage.getItem(CLAVE_STORAGE)).toBeNull();
  });
});
