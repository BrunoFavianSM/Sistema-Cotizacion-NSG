/**
 * Componente Generador de PDF
 * 
 * Genera y descarga PDFs de cotización:
 * - Solicita email opcional del cliente
 * - Genera cotización en el backend
 * - Descarga ambos PDFs (cotización + listado técnico)
 * - Muestra código ticket generado
 * - Diseño responsivo con Tailwind CSS
 * - Animaciones con Framer Motion
 * 
 * Valida Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { crearCotizacion } from '../servicios/api';

const GeneradorPDF = ({
  configuracion,
  margenGanancia = 20,
  onExito,
  onError,
  className = ''
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [emailCliente, setEmailCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [generando, setGenerando] = useState(false);
  const [cotizacionGenerada, setCotizacionGenerada] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Abre el modal para solicitar datos del cliente
   */
  const abrirModal = () => {
    setModalAbierto(true);
    setError(null);
    setCotizacionGenerada(null);
  };

  /**
   * Cierra el modal y limpia el estado
   */
  const cerrarModal = () => {
    setModalAbierto(false);
    setEmailCliente('');
    setNombreCliente('');
    setTelefonoCliente('');
    setError(null);
    setCotizacionGenerada(null);
  };

  /**
   * Prepara los componentes para enviar al backend
   */
  const prepararComponentes = () => {
    const componentes = [];

    // Agregar componentes individuales
    const categorias = ['procesador', 'placa_madre', 'almacenamiento', 'gpu', 'fuente', 'case'];
    
    categorias.forEach(categoria => {
      if (configuracion[categoria]) {
        componentes.push({
          id_producto: configuracion[categoria].id,
          cantidad: 1
        });
      }
    });

    // Agregar RAM (puede ser múltiple)
    if (configuracion.ram && configuracion.ram.length > 0) {
      configuracion.ram.forEach(ram => {
        componentes.push({
          id_producto: ram.id,
          cantidad: 1
        });
      });
    }

    return componentes;
  };

  /**
   * Genera la cotización y descarga los PDFs
   * Requisito 7.1: Generar presupuesto en PDF
   * Requisito 7.2: Solicitar email opcional
   * Requisito 7.3: Generar código único
   */
  const generarCotizacion = async () => {
    setGenerando(true);
    setError(null);

    try {
      // Preparar datos para el backend
      const componentes = prepararComponentes();

      if (componentes.length === 0) {
        throw new Error('No hay componentes seleccionados');
      }

      const datos = {
        componentes,
        email_cliente: emailCliente.trim() || undefined,
        nombre_cliente: nombreCliente.trim() || undefined,
        telefono_cliente: telefonoCliente.trim() || undefined
      };

      // Crear cotización en el backend
      const respuesta = await crearCotizacion(datos);

      if (!respuesta.exito) {
        throw new Error(respuesta.mensaje || 'Error al crear cotización');
      }

      // Guardar cotización generada
      setCotizacionGenerada(respuesta.cotizacion);

      // TODO: Descargar PDFs
      // Por ahora, el backend no tiene endpoint para descargar PDFs
      // Se necesitará agregar endpoints:
      // GET /api/cotizaciones/:codigoTicket/pdf/cotizacion
      // GET /api/cotizaciones/:codigoTicket/pdf/listado
      
      // Notificar éxito
      if (onExito) {
        onExito(respuesta.cotizacion);
      }

      // Mostrar notificación de éxito (Sileo)
      if (window.Sileo) {
        window.Sileo.success('¡Cotización generada exitosamente!');
      }
    } catch (err) {
      console.error('Error al generar cotización:', err);
      const mensajeError = err.mensaje || err.message || 'No se pudo generar la cotización';
      setError(mensajeError);

      // Notificar error
      if (onError) {
        onError(err);
      }

      // Mostrar notificación de error (Sileo)
      if (window.Sileo) {
        window.Sileo.error(mensajeError);
      }
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Descarga un PDF (placeholder - requiere endpoint en backend)
   */
  const descargarPDF = async (tipo) => {
    if (!cotizacionGenerada) return;

    try {
      // TODO: Implementar descarga de PDF cuando el backend tenga el endpoint
      // const url = `/api/cotizaciones/${cotizacionGenerada.codigo_ticket}/pdf/${tipo}`;
      // const response = await fetch(url);
      // const blob = await response.blob();
      // const link = document.createElement('a');
      // link.href = URL.createObjectURL(blob);
      // link.download = `${tipo}-${cotizacionGenerada.codigo_ticket}.pdf`;
      // link.click();

      if (window.Sileo) {
        window.Sileo.info('Función de descarga de PDF en desarrollo');
      }
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      if (window.Sileo) {
        window.Sileo.error('Error al descargar PDF');
      }
    }
  };

  /**
   * Formatea la fecha para mostrar
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Valida si el email es válido
   */
  const esEmailValido = (email) => {
    if (!email) return true; // Email es opcional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Variantes de animación
  const variantesOverlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const variantesModal = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Botón para generar PDF */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={abrirModal}
        className={`
          w-full py-4 px-6
          bg-gradient-to-r from-green-600 to-emerald-600
          hover:from-green-700 hover:to-emerald-700
          text-white font-bold text-lg rounded-lg
          shadow-lg hover:shadow-xl
          transition-all duration-300
          flex items-center justify-center gap-3
          ${className}
        `}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Generar Cotización PDF</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {modalAbierto && (
          <>
            {/* Overlay */}
            <motion.div
              variants={variantesOverlay}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={cerrarModal}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            {/* Modal Content */}
            <motion.div
              variants={variantesModal}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[550px] md:max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Generar Cotización</h3>
                    <p className="text-sm text-white text-opacity-90">
                      {cotizacionGenerada ? 'Cotización generada' : 'Datos del cliente (opcional)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {!cotizacionGenerada ? (
                  <>
                    {/* Formulario de datos del cliente */}
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Proporciona tus datos para recibir un historial de tus cotizaciones.
                        Todos los campos son opcionales.
                      </p>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email (opcional)
                        </label>
                        <input
                          type="email"
                          value={emailCliente}
                          onChange={(e) => setEmailCliente(e.target.value)}
                          placeholder="tu@email.com"
                          disabled={generando}
                          className={`
                            w-full px-4 py-3 border rounded-lg
                            focus:ring-2 focus:ring-green-500 focus:border-transparent
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${emailCliente && !esEmailValido(emailCliente)
                              ? 'border-red-500'
                              : 'border-gray-300'
                            }
                          `}
                        />
                        {emailCliente && !esEmailValido(emailCliente) && (
                          <p className="text-xs text-red-600 mt-1">
                            Email inválido
                          </p>
                        )}
                      </div>

                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre completo (opcional)
                        </label>
                        <input
                          type="text"
                          value={nombreCliente}
                          onChange={(e) => setNombreCliente(e.target.value)}
                          placeholder="Juan Pérez"
                          disabled={generando}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono (opcional)
                        </label>
                        <input
                          type="tel"
                          value={telefonoCliente}
                          onChange={(e) => setTelefonoCliente(e.target.value)}
                          placeholder="999 999 999"
                          disabled={generando}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Error message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Cotización generada exitosamente */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      {/* Código de ticket */}
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">Código de Ticket</p>
                        <p className="text-4xl font-bold text-green-700 mb-2 font-mono">
                          {cotizacionGenerada.codigo_ticket}
                        </p>
                        <p className="text-xs text-gray-500">
                          Presenta este código en tienda para reclamar tu cotización
                        </p>
                      </div>

                      {/* Información de la cotización */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Fecha de emisión:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatearFecha(cotizacionGenerada.fecha_emision)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Válida hasta:</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatearFecha(cotizacionGenerada.fecha_validez)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Precio total:</span>
                          <span className="text-lg font-bold text-green-600">
                            S/ {cotizacionGenerada.precio_total.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Estado:</span>
                          <span className="text-sm font-medium text-blue-600">
                            {cotizacionGenerada.estado}
                          </span>
                        </div>
                      </div>

                      {/* Botones de descarga de PDF */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Descargar PDFs:</p>
                        <button
                          onClick={() => descargarPDF('cotizacion')}
                          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Cotización con Precios</span>
                        </button>
                        <button
                          onClick={() => descargarPDF('listado')}
                          className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Listado Técnico</span>
                        </button>
                      </div>

                      {/* Nota informativa */}
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <span className="font-semibold">Importante:</span> Esta cotización es válida por 15 días.
                          Los precios están sujetos a cambios según disponibilidad.
                        </p>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                {!cotizacionGenerada ? (
                  <div className="flex gap-3">
                    <button
                      onClick={cerrarModal}
                      disabled={generando}
                      className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={generarCotizacion}
                      disabled={generando || (emailCliente && !esEmailValido(emailCliente))}
                      className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generando ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Generar Cotización</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={cerrarModal}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

GeneradorPDF.propTypes = {
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
  onExito: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string
};

export default GeneradorPDF;

