/**
 * PanelComparador
 *
 * Muestra las especificaciones técnicas de hasta 3 productos en columnas
 * paralelas, resaltando las diferencias entre ellos. Solo se renderiza
 * cuando hay al menos 2 productos en la lista de comparación.
 *
 * Accesibilidad:
 * - Navegación por teclado entre columnas con teclas de flecha (←/→).
 * - Botón de cierre por producto con aria-label descriptivo.
 * - Tabla con scope="col" y scope="row" para lectores de pantalla.
 *
 * Valida Requisitos: 6.1, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import { useCallback, useEffect, useRef } from 'react';
import { formatearCategoria } from '../../dominio/categorias';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrae las especificaciones relevantes de un producto para mostrar en el
 * comparador. Devuelve un objeto plano con claves legibles.
 *
 * @param {Object} producto
 * @returns {Record<string, string>}
 */
function extraerEspecificaciones(producto) {
  if (!producto) return {};

  const specs = {};

  // Campos comunes a todos los productos
  if (producto.nombre) specs['Nombre'] = producto.nombre;
  if (producto.categoria) specs['Categoría'] = formatearCategoria(producto.categoria);
  if (producto.precio_base != null) specs['Precio base (USD)'] = `$${Number(producto.precio_base).toFixed(2)}`;
  if (producto.descripcion_tecnica) specs['Descripción'] = producto.descripcion_tecnica;

  // Campos específicos por tipo de componente
  if (producto.socket) specs['Socket'] = producto.socket;
  if (producto.ram_type) specs['Tipo de RAM'] = producto.ram_type;
  if (producto.form_factor) specs['Form factor'] = producto.form_factor;
  if (producto.wattage) specs['Potencia (W)'] = `${producto.wattage} W`;
  if (producto.marca) specs['Marca'] = producto.marca;
  if (producto.chipset) specs['Chipset'] = producto.chipset;
  if (producto.frecuencia) specs['Frecuencia'] = producto.frecuencia;
  if (producto.capacidad) specs['Capacidad'] = producto.capacidad;
  if (producto.interfaz) specs['Interfaz'] = producto.interfaz;
  if (producto.velocidad) specs['Velocidad'] = producto.velocidad;
  if (producto.tdp) specs['TDP'] = `${producto.tdp} W`;
  if (producto.nucleos) specs['Núcleos'] = String(producto.nucleos);
  if (producto.hilos) specs['Hilos'] = String(producto.hilos);
  if (producto.vram) specs['VRAM'] = producto.vram;
  if (producto.certificacion) specs['Certificación'] = producto.certificacion;

  // Stock
  if (producto.stock != null) {
    specs['Stock'] = producto.stock > 0
      ? `${producto.stock} unidades`
      : producto.disponible_a_pedido
        ? 'A pedido'
        : 'Sin stock';
  }

  return specs;
}

/**
 * Obtiene el conjunto unión de todas las claves de especificaciones de los
 * productos, manteniendo el orden de aparición.
 *
 * @param {Array<Object>} productos
 * @returns {string[]}
 */
function obtenerFilasEspecificaciones(productos) {
  const claves = new Set();
  productos.forEach((p) => {
    Object.keys(extraerEspecificaciones(p)).forEach((k) => claves.add(k));
  });
  return Array.from(claves);
}

/**
 * Determina si una fila tiene valores distintos entre los productos.
 *
 * @param {string} clave
 * @param {Array<Object>} productos
 * @returns {boolean}
 */
function filaEsDiferente(clave, productos) {
  const valores = productos.map((p) => extraerEspecificaciones(p)[clave] ?? '—');
  return new Set(valores).size > 1;
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   productos: Array<Object>,
 *   onQuitarProducto: (idProducto: number) => void,
 * }} props
 */
export default function PanelComparador({ productos, onQuitarProducto }) {
  const columnasRef = useRef([]);
  const panelRef = useRef(null);

  // Solo renderizar con al menos 2 productos (Req. 6.5)
  if (!productos || productos.length < 2) return null;

  const filas = obtenerFilasEspecificaciones(productos);

  // ── Navegación por teclado entre columnas (Req. 6.8) ─────────────────────
  const handleKeyDown = useCallback(
    (event, indiceColumna) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const siguiente = columnasRef.current[indiceColumna + 1];
        if (siguiente) siguiente.focus();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const anterior = columnasRef.current[indiceColumna - 1];
        if (anterior) anterior.focus();
      }
    },
    []
  );

  // Scroll suave al montar el panel (solo en entornos que soporten scrollIntoView)
  useEffect(() => {
    if (panelRef.current && typeof panelRef.current.scrollIntoView === 'function') {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <section
      ref={panelRef}
      aria-label="Panel de comparación de productos"
      className="surface-elevated overflow-hidden rounded-[var(--radius-lg)]"
    >
      {/* Encabezado del panel */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          Comparación de productos
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {productos.length} de 3 productos
        </span>
      </div>

      {/* Tabla de comparación */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          {/* Cabecera con nombres y botones de cierre */}
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {/* Celda vacía para la columna de etiquetas */}
              <th
                scope="col"
                className="w-36 shrink-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
              >
                Especificación
              </th>

              {productos.map((producto, indice) => (
                <th
                  key={producto.id}
                  scope="col"
                  ref={(el) => { columnasRef.current[indice] = el; }}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, indice)}
                  className="min-w-[160px] px-4 py-3 text-left align-top outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold text-[var(--color-text)]">
                      {producto.nombre}
                    </span>
                    {/* Botón de cierre por producto (Req. 6.7) */}
                    <button
                      type="button"
                      onClick={() => onQuitarProducto(producto.id)}
                      aria-label={`Quitar ${producto.nombre} de la comparación`}
                      className="ml-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-higFast hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Precio destacado bajo el nombre */}
                  {producto.precio_base != null && (
                    <p className="mt-1 text-base font-semibold text-[var(--color-accent-text)]">
                      ${Number(producto.precio_base).toFixed(2)}
                    </p>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo: filas de especificaciones */}
          <tbody>
            {filas
              // Omitir "Nombre" y "Precio base" porque ya están en el encabezado
              .filter((fila) => fila !== 'Nombre' && fila !== 'Precio base (USD)')
              .map((fila, indiceFila) => {
                const esDiferente = filaEsDiferente(fila, productos);
                const esFilaPar = indiceFila % 2 === 0;

                return (
                  <tr
                    key={fila}
                    className={`border-b border-[var(--color-border)] last:border-0 ${
                      esFilaPar
                        ? 'bg-[var(--color-surface)]'
                        : 'bg-[var(--color-surface-soft)]'
                    }`}
                  >
                    {/* Etiqueta de la fila */}
                    <th
                      scope="row"
                      className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]"
                    >
                      {fila}
                    </th>

                    {/* Valores por producto */}
                    {productos.map((producto) => {
                      const valor = extraerEspecificaciones(producto)[fila] ?? '—';
                      const esVacio = valor === '—';

                      return (
                        <td
                          key={`${producto.id}-${fila}`}
                          className={`px-4 py-3 align-top text-sm ${
                            // Resaltar diferencias (Req. 6.6)
                            esDiferente && !esVacio
                              ? 'font-semibold text-[var(--color-accent-text)]'
                              : esVacio
                                ? 'text-[var(--color-text-muted)]'
                                : 'text-[var(--color-text)]'
                          }`}
                        >
                          {/* Indicador visual de diferencia */}
                          {esDiferente && !esVacio && (
                            <span
                              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] align-middle"
                              aria-hidden="true"
                            />
                          )}
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Leyenda de diferencias */}
      <div className="border-t border-[var(--color-border)] px-5 py-3">
        <p className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
            aria-hidden="true"
          />
          Los valores resaltados indican diferencias entre los productos comparados.
        </p>
      </div>
    </section>
  );
}
