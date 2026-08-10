/**
 * Componente Resumen de Cotización
 * 
 * Muestra un resumen de la configuración seleccionada con:
 * - Lista de componentes seleccionados con nombres y precios
 * - Cálculo del precio total aplicando margen de ganancia
 * - Indicador de tiempo de entrega si hay componentes a pedido
 * - Diseño claro y responsivo con Tailwind CSS
 * - Animaciones suaves con Framer Motion
 * 
 * Valida Requisitos: 6.1, 6.2
 */

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatearCategoria } from '../dominio/categorias';

const ResumenCotizacion = ({
  configuracion,
  margenGanancia = 20,
  mostrarMargen = false,
  className = ''
}) => {
  /**
   * Obtiene todos los componentes seleccionados como array
   */
  const obtenerComponentesArray = () => {
    const componentes = [];

    // Agregar componentes individuales
    const categorias = ['procesador', 'placa_madre', 'almacenamiento', 'gpu', 'fuente', 'case'];
    
    categorias.forEach(categoria => {
      if (configuracion[categoria]) {
        componentes.push({
          categoria,
          producto: configuracion[categoria]
        });
      }
    });

    // Agregar RAM (puede ser múltiple)
    if (configuracion.ram && configuracion.ram.length > 0) {
      configuracion.ram.forEach((ram, index) => {
        componentes.push({
          categoria: 'ram',
          producto: ram,
          indice: index
        });
      });
    }

    return componentes;
  };

  /**
   * Calcula el precio base total (sin margen)
   * Requisito 6.1: Calcular precio total sumando precios_base
   */
  const calcularPrecioBase = () => {
    let total = 0;
    const componentes = obtenerComponentesArray();
    
    componentes.forEach(({ producto }) => {
      total += parseFloat(producto.precio_base || 0);
    });

    return total;
  };

  /**
   * Calcula el precio total con margen
   * Requisito 6.2: Aplicar margen de ganancia configurable
   */
  const calcularPrecioTotal = () => {
    const precioBase = calcularPrecioBase();
    return precioBase * (1 + margenGanancia / 100);
  };

  /**
   * Identifica componentes a pedido y calcula tiempo máximo de entrega
   */
  const obtenerInfoEntrega = () => {
    const componentes = obtenerComponentesArray();
    const componentesAPedido = componentes.filter(
      ({ producto }) => producto.stock === 0 && producto.disponible_a_pedido
    );

    if (componentesAPedido.length === 0) {
      return null;
    }

    const tiempoMaximo = Math.max(
      ...componentesAPedido.map(({ producto }) => producto.tiempo_entrega_dias || 7)
    );

    return {
      cantidad: componentesAPedido.length,
      tiempoMaximo,
      componentes: componentesAPedido.map(({ categoria, producto }) => ({
        nombre: producto.nombre,
        categoria: formatearCategoria(categoria),
        dias: producto.tiempo_entrega_dias || 7
      }))
    };
  };

  const componentes = obtenerComponentesArray();
  const precioBase = calcularPrecioBase();
  const precioTotal = calcularPrecioTotal();
  const infoEntrega = obtenerInfoEntrega();

  // Si no hay componentes, no mostrar nada
  if (componentes.length === 0) {
    return null;
  }

  // Variantes de animación
  const variantesContenedor = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const variantesItem = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={variantesContenedor}
      initial="hidden"
      animate="visible"
      className={`resumen-cotizacion bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Resumen de Cotización
        </h2>
        <p className="text-sm text-gray-600">
          {componentes.length} componente{componentes.length !== 1 ? 's' : ''} seleccionado{componentes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de componentes */}
      <div className="mb-6 space-y-3">
        {componentes.map(({ categoria, producto, indice }, index) => {
          const esAPedido = producto.stock === 0 && producto.disponible_a_pedido;
          const enStock = producto.stock > 0;

          return (
            <motion.div
              key={`${categoria}-${producto.id}-${indice || 0}`}
              variants={variantesItem}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {formatearCategoria(categoria)}
                    {categoria === 'ram' && indice !== undefined && ` #${indice + 1}`}
                  </span>
                  {esAPedido && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                      A Pedido
                    </span>
                  )}
                  {enStock && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                      En Stock
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {producto.nombre}
                </p>
                {producto.descripcion_tecnica && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {producto.descripcion_tecnica}
                  </p>
                )}
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-bold text-blue-600">
                  S/ {parseFloat(producto.precio_base).toFixed(2)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Información de entrega (si hay componentes a pedido) */}
      {infoEntrega && (
        <motion.div
          variants={variantesItem}
          className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                Tiempo de Entrega
              </h4>
              <p className="text-sm text-yellow-700">
                {infoEntrega.cantidad} componente{infoEntrega.cantidad !== 1 ? 's' : ''} a pedido.
                Tiempo estimado: <span className="font-bold">{infoEntrega.tiempoMaximo} días</span>
              </p>
              {infoEntrega.componentes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {infoEntrega.componentes.map((comp, idx) => (
                    <li key={idx} className="text-xs text-yellow-600">
                      �?� {comp.categoria}: {comp.nombre} ({comp.dias}d)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Separador */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Cálculo de precios */}
      <motion.div variants={variantesItem} className="space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-900">
            S/ {precioBase.toFixed(2)}
          </span>
        </div>

        {/* Margen de ganancia (opcional) */}
        {mostrarMargen && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Margen ({margenGanancia}%):
            </span>
            <span className="font-medium text-gray-900">
              S/ {(precioTotal - precioBase).toFixed(2)}
            </span>
          </div>
        )}

        {/* Separador */}
        <div className="border-t border-gray-300 my-2"></div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">
            Total:
          </span>
          <span className="text-2xl font-bold text-blue-600">
            S/ {precioTotal.toFixed(2)}
          </span>
        </div>

        {/* Nota sobre el margen */}
        {!mostrarMargen && (
          <p className="text-xs text-gray-500 mt-2">
            * Precio incluye margen de ganancia del {margenGanancia}%
          </p>
        )}
      </motion.div>

      {/* Información adicional */}
      <motion.div
        variants={variantesItem}
        className="mt-6 p-3 bg-blue-50 rounded-lg"
      >
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Nota:</span> Los precios están sujetos a cambios.
          La cotización es válida por 15 días desde su emisión.
        </p>
      </motion.div>
    </motion.div>
  );
};

ResumenCotizacion.propTypes = {
  configuracion: PropTypes.shape({
    procesador: PropTypes.object,
    placa_madre: PropTypes.object,
    ram: PropTypes.array,
    almacenamiento: PropTypes.object,
    gpu: PropTypes.object,
    fuente: PropTypes.object,
    case: PropTypes.object
  }).isRequired,
  margenGanancia: PropTypes.number,
  mostrarMargen: PropTypes.bool,
  className: PropTypes.string
};

export default ResumenCotizacion;

