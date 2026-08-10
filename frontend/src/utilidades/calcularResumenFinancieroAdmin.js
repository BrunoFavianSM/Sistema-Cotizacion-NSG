/**
 * calcularResumenFinancieroAdmin
 *
 * Función pura que implementa la fórmula financiera extendida del cotizador.
 * Separada del componente para ser testeable de forma independiente.
 *
 * Fórmula:
 *   Costo_CPU          = Σ(7 componentes) + embalaje (si activo) + flete (si activo)
 *   Costo_CPU_Periféricos = Costo_CPU + Σ(extras)
 *   Utilidad_USD       = Costo_CPU_Periféricos × (margenGanancia / 100)
 *   Precio_Venta_USD   = Costo_CPU_Periféricos + Utilidad_USD
 *   IGV_USD            = Precio_Venta_USD × (tasaIgv / 100)
 *   Precio_Final_USD   = Precio_Venta_USD + IGV_USD
 *   Precio_Final_PEN   = Precio_Final_USD × tipoCambioUsdPen
 *
 * Requisitos: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.12
 */

/**
 * Calcula el resumen financiero completo para el panel de administrador.
 *
 * @param {object} params
 * @param {object} params.configuracionSeleccionada - Objeto con precios de los 7 componentes
 *   { procesador, placa_madre, ram (array), almacenamiento, gpu, fuente, case }
 * @param {object} params.extras - Mapa de categoría → array de { producto, cantidad }
 * @param {object} params.embalaje - { activo: bool, opcion: string, precioBasico: number, precioAvanzado: number }
 * @param {object} params.flete   - { activo: bool, precio: number }
 * @param {number} params.margenGanancia  - Porcentaje de margen (ej: 20 para 20%)
 * @param {number} params.tasaIgv         - Porcentaje de IGV (ej: 18 para 18%)
 * @param {number} params.tipoCambioUsdPen - Tipo de cambio USD → PEN
 *
 * @returns {{
 *   costo_cpu_usd: number,
 *   costo_cpu_perifericos_usd: number,
 *   utilidad_usd: number,
 *   precio_venta_usd: number,
 *   igv_usd: number,
 *   precio_final_usd: number,
 *   precio_final_pen: number,
 * }}
 */
export function calcularResumenFinancieroAdmin({
  configuracionSeleccionada = {},
  extras = {},
  embalaje = { activo: false, opcion: 'basico', precioBasico: 20, precioAvanzado: 30 },
  flete = { activo: false, precio: 20 },
  margenGanancia = 0,
  tasaIgv = 0,
  tipoCambioUsdPen = 1,
}) {
  // ── Paso 1: Costo_CPU — 7 componentes + embalaje + flete ─────────────────

  let costo_cpu_usd = 0;

  // Componentes individuales (6 de precio único)
  const componentesSimples = ['procesador', 'placa_madre', 'almacenamiento', 'gpu', 'fuente', 'case'];
  for (const clave of componentesSimples) {
    const componente = configuracionSeleccionada[clave];
    if (componente && componente.precio_base != null) {
      costo_cpu_usd += parseFloat(componente.precio_base) || 0;
    }
  }

  // RAM (puede ser múltiple)
  const rams = configuracionSeleccionada.ram;
  if (Array.isArray(rams)) {
    for (const ram of rams) {
      if (ram && ram.precio_base != null) {
        costo_cpu_usd += parseFloat(ram.precio_base) || 0;
      }
    }
  }

  // Embalaje (si está activo)
  if (embalaje.activo) {
    const precioEmbalaje =
      embalaje.opcion === 'avanzado'
        ? parseFloat(embalaje.precioAvanzado) || 0
        : parseFloat(embalaje.precioBasico) || 0;
    if (precioEmbalaje > 0) {
      costo_cpu_usd += precioEmbalaje;
    }
  }

  // Flete (si está activo)
  if (flete.activo) {
    const precioFlete = parseFloat(flete.precio) || 0;
    if (precioFlete > 0) {
      costo_cpu_usd += precioFlete;
    }
  }

  // ── Paso 2: Costo_CPU_Periféricos — Costo_CPU + extras ───────────────────

  let suma_extras = 0;
  for (const catItems of Object.values(extras)) {
    if (Array.isArray(catItems)) {
      for (const { producto, cantidad } of catItems) {
        if (producto && producto.precio_base != null) {
          suma_extras += (parseFloat(producto.precio_base) || 0) * (cantidad || 0);
        }
      }
    }
  }

  const costo_cpu_perifericos_usd = costo_cpu_usd + suma_extras;

  // ── Paso 3: Utilidad_USD ──────────────────────────────────────────────────

  const utilidad_usd = costo_cpu_perifericos_usd * ((parseFloat(margenGanancia) || 0) / 100);

  // ── Paso 4: Precio_Venta_USD ──────────────────────────────────────────────

  const precio_venta_usd = costo_cpu_perifericos_usd + utilidad_usd;

  // ── Paso 5: IGV_USD ───────────────────────────────────────────────────────

  const igv_usd = precio_venta_usd * ((parseFloat(tasaIgv) || 0) / 100);

  // ── Paso 6: Precio_Final_USD ──────────────────────────────────────────────

  const precio_final_usd = precio_venta_usd + igv_usd;

  // ── Paso 7: Precio_Final_PEN ──────────────────────────────────────────────

  const precio_final_pen = precio_final_usd * (parseFloat(tipoCambioUsdPen) || 1);

  return {
    costo_cpu_usd,
    costo_cpu_perifericos_usd,
    utilidad_usd,
    precio_venta_usd,
    igv_usd,
    precio_final_usd,
    precio_final_pen,
  };
}
