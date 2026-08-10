/**
 * Página de Configuración Compartida
 *
 * Decodifica el parámetro `config` de la query string (base64) y carga
 * automáticamente los componentes correspondientes en el cotizador.
 *
 * Flujo:
 *  1. Leer ?config=<base64> al montar.
 *  2. Decodificar con decodificarConfiguracion; si falla → mensaje de error + redirect.
 *  3. Resolver cada ID de producto contra el catálogo.
 *  4. Aplicar los productos encontrados en configuracionSeleccionada.
 *  5. Si algún producto no existe → cargar los disponibles + toast informativo.
 *  6. Redirigir al cotizador con la configuración cargada.
 *
 * Valida Requisitos: 10.4, 10.5, 10.6, 10.7
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import { decodificarConfiguracion, obtenerProductoPorId } from '../servicios/api';

// Categorías de componentes principales del cotizador
const CATEGORIAS_COMPONENTE = [
  'procesador',
  'placa_madre',
  'ram',
  'almacenamiento',
  'gpu',
  'fuente',
  'case',
];

export default function ConfiguracionCompartida() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { seleccionarComponente, agregarRAM, limpiarConfiguracion } = useAppContext();

  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'error'
  const [mensajeError, setMensajeError] = useState('');
  const procesado = useRef(false);

  useEffect(() => {
    // Evitar doble ejecución en StrictMode
    if (procesado.current) return;
    procesado.current = true;

    const cargarConfiguracion = async () => {
      const configParam = searchParams.get('config');

      // Req. 10.6 — parámetro ausente o vacío
      if (!configParam) {
        setMensajeError('No se encontró una configuración en el enlace.');
        setEstado('error');
        return;
      }

      // Req. 10.6 — decodificar; si falla, redirigir al cotizador vacío
      let configuracionDecodificada;
      try {
        configuracionDecodificada = decodificarConfiguracion(configParam);
      } catch (error) {
        setMensajeError(error?.message || 'El enlace de configuración no es válido.');
        setEstado('error');
        return;
      }

      // Validar que sea un objeto con al menos una categoría conocida
      const categoriasEncontradas = Object.keys(configuracionDecodificada).filter((k) =>
        CATEGORIAS_COMPONENTE.includes(k)
      );

      if (categoriasEncontradas.length === 0) {
        setMensajeError('El enlace no contiene componentes reconocidos.');
        setEstado('error');
        return;
      }

      // Limpiar configuración actual antes de aplicar la compartida
      limpiarConfiguracion();

      const noEncontrados = [];

      // Resolver cada categoría en paralelo
      await Promise.all(
        categoriasEncontradas.map(async (categoria) => {
          const valor = configuracionDecodificada[categoria];

          if (categoria === 'ram') {
            // RAM puede ser un array de { id, categoria }
            const items = Array.isArray(valor) ? valor : [valor];
            await Promise.all(
              items.map(async (item) => {
                if (!item?.id) return;
                try {
                  const respuesta = await obtenerProductoPorId(
                    item.categoria || 'ram',
                    item.id
                  );
                  const producto = respuesta?.producto || respuesta;
                  if (producto?.id) {
                    agregarRAM(producto);
                  } else {
                    noEncontrados.push(`RAM (ID ${item.id})`);
                  }
                } catch {
                  noEncontrados.push(`RAM (ID ${item.id})`);
                }
              })
            );
          } else {
            // Componente único: { id, categoria }
            const item = Array.isArray(valor) ? valor[0] : valor;
            if (!item?.id) return;

            try {
              const respuesta = await obtenerProductoPorId(
                item.categoria || categoria,
                item.id
              );
              const producto = respuesta?.producto || respuesta;
              if (producto?.id) {
                seleccionarComponente(categoria, producto);
              } else {
                noEncontrados.push(categoria);
              }
            } catch {
              noEncontrados.push(categoria);
            }
          }
        })
      );

      // Req. 10.7 — informar productos no encontrados
      if (noEncontrados.length > 0) {
        const nombresLegibles = noEncontrados.join(', ');
        toast.warning(
          'Algunos componentes no están disponibles',
          `No se pudieron cargar: ${nombresLegibles}. Se cargaron los demás componentes disponibles.`
        );
      } else {
        toast.success(
          'Configuración cargada',
          'Se aplicaron todos los componentes del enlace compartido.'
        );
      }

      // Redirigir al cotizador con la configuración ya aplicada
      navigate('/cotizador', { replace: true });
    };

    cargarConfiguracion();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Estado de error (Req. 10.6) ───────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <ErrorState
            title="Enlace de configuración inválido"
            description={mensajeError}
            onRetry={() => navigate('/cotizador', { replace: true })}
            retryLabel="Ir al cotizador"
          />
        </motion.div>
      </div>
    );
  }

  // ── Estado de carga ───────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner label="Cargando configuración compartida..." />
      <p className="text-sm text-[var(--color-text-muted)]">
        Aplicando los componentes del enlace…
      </p>
    </div>
  );
}
