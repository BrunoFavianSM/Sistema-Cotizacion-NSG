/**
 * useClienteAutocompletado.js
 *
 * Hook para autocompletar datos del cliente desde la base de datos.
 * Busca por email o teléfono con debounce de 300ms.
 *
 * Usa el servicio central de API (axios) para que la petición viaje
 * autenticada; el endpoint requiere rol admin o vendedor.
 */

import { useState, useEffect, useCallback } from 'react';
import { buscarClienteAutocompletado } from '../servicios/api';

/**
 * Hook para autocompletar datos del cliente
 * @param {string} valorBusqueda - Email o teléfono a buscar
 * @param {boolean} habilitado - Si la búsqueda está habilitada
 * @returns {object} { cliente, buscando, error }
 */
export function useClienteAutocompletado(valorBusqueda, habilitado = true) {
  const [cliente, setCliente] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  const buscarCliente = useCallback(async (valor) => {
    if (!valor || valor.trim().length < 3) {
      setCliente(null);
      return;
    }

    setBuscando(true);
    setError(null);

    try {
      const data = await buscarClienteAutocompletado(valor.trim());

      if (data.encontrado) {
        setCliente(data.cliente);
      } else {
        setCliente(null);
      }
    } catch (err) {
      setError(err?.mensaje || err?.message || 'Error al buscar cliente');
      setCliente(null);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      buscarCliente(valorBusqueda);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [valorBusqueda, habilitado, buscarCliente]);

  return { cliente, buscando, error };
}
