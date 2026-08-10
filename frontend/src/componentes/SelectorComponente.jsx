/**
 * Componente Selector de Componentes
 * 
 * Componente reutilizable para seleccionar componentes de hardware.
 * Características:
 * - Muestra solo productos disponibles (stock > 0 O disponible_a_pedido)
 * - Indica disponibilidad (En Stock / A Pedido con días)
 * - Filtra por compatibilidad (socket, RAM type)
 * - Reutilizable para todas las categorías
 *
 * Valida Requisitos: 2.1, 2.2, 2.3, 3.2
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatearCategoria } from '../dominio/categorias';

const SelectorComponente = ({
  categoria,
  productos,
  seleccionActual,
  onSeleccionar,
  filtrosCompatibilidad = {},
  permitirMultiple = false,
  cargando = false
}) => {
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Filtrar productos por disponibilidad y compatibilidad
  useEffect(() => {
    let filtrados = productos.filter(p => p.categoria === categoria);

    // Requisito 2.2: Mostrar solo productos con stock > 0 O disponible_a_pedido
    filtrados = filtrados.filter(p => p.stock > 0 || p.disponible_a_pedido);

    // Requisito 3.2: Filtrar por compatibilidad de socket
    if (filtrosCompatibilidad.socket) {
      filtrados = filtrados.filter(p => {
        // Si el producto no tiene socket, no filtrar
        if (!p.socket) return true;
        return p.socket === filtrosCompatibilidad.socket;
      });
    }

    // Filtrar por tipo de RAM
    if (filtrosCompatibilidad.ramType) {
      filtrados = filtrados.filter(p => {
        // Si el producto no tiene ram_type, no filtrar
        if (!p.ram_type) return true;
        return p.ram_type === filtrosCompatibilidad.ramType;
      });
    }

    // Filtrar por form factor
    if (filtrosCompatibilidad.formFactor) {
      filtrados = filtrados.filter(p => {
        // Si el producto no tiene form_factor, no filtrar
        if (!p.form_factor) return true;
        return p.form_factor === filtrosCompatibilidad.formFactor;
      });
    }

    // Filtrar por búsqueda de texto
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        (p.descripcion_tecnica && p.descripcion_tecnica.toLowerCase().includes(termino))
      );
    }

    setProductosFiltrados(filtrados);
  }, [productos, categoria, filtrosCompatibilidad, busqueda]);

  /**
   * Verifica si un producto está seleccionado
   */
  const estaSeleccionado = (producto) => {
    if (!seleccionActual) return false;

    if (Array.isArray(seleccionActual)) {
      return seleccionActual.some(p => p.id === producto.id);
    }

    return seleccionActual.id === producto.id;
  };

  /**
   * Maneja la selección de un producto
   */
  const manejarSeleccion = (producto) => {
    if (permitirMultiple) {
      // Para RAM: permitir múltiples selecciones
      if (estaSeleccionado(producto)) {
        // Deseleccionar
        const nuevaSeleccion = seleccionActual.filter(p => p.id !== producto.id);
        onSeleccionar(nuevaSeleccion);
      } else {
        // Agregar a la selección
        const nuevaSeleccion = seleccionActual ? [...seleccionActual, producto] : [producto];
        onSeleccionar(nuevaSeleccion);
      }
    } else {
      // Para otros componentes: selección única
      onSeleccionar(producto);
    }
  };

  /**
   * Obtiene el indicador de disponibilidad
   * Requisito 2.3: Indicar disponibilidad (En Stock / A Pedido con días)
   */
  const obtenerIndicadorDisponibilidad = (producto) => {
    if (producto.stock > 0) {
      return {
        texto: `En Stock (${producto.stock})`,
        clase: 'bg-green-100 text-green-800',
        icono: '�o"'
      };
    } else if (producto.disponible_a_pedido) {
      const dias = producto.tiempo_entrega_dias || 7;
      return {
        texto: `A Pedido (${dias}d)`,
        clase: 'bg-yellow-100 text-yellow-800',
        icono: '⏱'
      };
    } else {
      return {
        texto: 'Sin Stock',
        clase: 'bg-red-100 text-red-800',
        icono: '�o-'
      };
    }
  };

  // Variantes de animación
  const variantesTarjeta = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <div className="selector-componente">
      {/* Encabezado con búsqueda */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {formatearCategoria(categoria)}
          </h3>
          <span className="text-sm text-gray-600">
            {productosFiltrados.length} disponible{productosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre o especificaciones..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Filtros activos */}
        {Object.keys(filtrosCompatibilidad).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filtrosCompatibilidad.socket && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Socket: {filtrosCompatibilidad.socket}
              </span>
            )}
            {filtrosCompatibilidad.ramType && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                RAM: {filtrosCompatibilidad.ramType}
              </span>
            )}
            {filtrosCompatibilidad.formFactor && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Form Factor: {filtrosCompatibilidad.formFactor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de productos */}
      {cargando ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">No hay productos disponibles</p>
          <p className="text-sm">
            {busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay productos compatibles en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosFiltrados.map((producto, index) => {
            const disponibilidad = obtenerIndicadorDisponibilidad(producto);
            const seleccionado = estaSeleccionado(producto);

            return (
              <motion.div
                key={producto.id}
                custom={index}
                variants={variantesTarjeta}
                initial="hidden"
                animate="visible"
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  hover:shadow-lg hover:border-blue-500
                  ${seleccionado
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-200'
                  }
                `}
                onClick={() => manejarSeleccion(producto)}
              >
                {/* Nombre del producto */}
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex-1">
                    {producto.nombre}
                  </h4>
                  {seleccionado && (
                    <span className="ml-2 text-blue-600 text-xl">�o"</span>
                  )}
                </div>

                {/* Especificaciones técnicas */}
                {producto.descripcion_tecnica && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {producto.descripcion_tecnica}
                  </p>
                )}

                {/* Especificaciones clave */}
                <div className="mb-3 space-y-1">
                  {producto.socket && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Socket:</span> {producto.socket}
                    </div>
                  )}
                  {producto.ram_type && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">RAM:</span> {producto.ram_type}
                    </div>
                  )}
                  {producto.form_factor && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Form Factor:</span> {producto.form_factor}
                    </div>
                  )}
                  {producto.wattage && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Potencia:</span> {producto.wattage}W
                    </div>
                  )}
                  {producto.tdp && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">TDP:</span> {producto.tdp}W
                    </div>
                  )}
                </div>

                {/* Precio y disponibilidad */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">
                    S/ {parseFloat(producto.precio_base).toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${disponibilidad.clase}`}>
                    <span>{disponibilidad.icono}</span>
                    <span>{disponibilidad.texto}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Información de selección múltiple */}
      {permitirMultiple && seleccionActual && seleccionActual.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {seleccionActual.length} módulo{seleccionActual.length !== 1 ? 's' : ''} de RAM seleccionado{seleccionActual.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

SelectorComponente.propTypes = {
  categoria: PropTypes.string.isRequired,
  productos: PropTypes.array.isRequired,
  seleccionActual: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  onSeleccionar: PropTypes.func.isRequired,
  filtrosCompatibilidad: PropTypes.shape({
    socket: PropTypes.string,
    ramType: PropTypes.string,
    formFactor: PropTypes.string
  }),
  permitirMultiple: PropTypes.bool,
  cargando: PropTypes.bool
};

export default SelectorComponente;

