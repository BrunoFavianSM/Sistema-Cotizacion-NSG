import { useState, useEffect } from 'react';
import { obtenerEmailsRegistrados } from '../servicios/api';

/**
 * Hook para obtener lista de emails registrados en el sistema.
 * Usado para datalist de autocompletado en campo de email.
 *
 * El endpoint expone datos personales descifrados, por lo que requiere
 * rol admin o vendedor; pasar `habilitado=false` para usuarios sin permiso
 * y así evitar peticiones que serían rechazadas con 401/403.
 *
 * @param {boolean} habilitado - Solo carga la lista si es true
 * @returns {object} { emails: string[], cargando: boolean, error: string|null }
 */
export function useEmailsRegistrados(habilitado = false) {
  const [emails, setEmails] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!habilitado) {
      setEmails([]);
      setCargando(false);
      return;
    }

    let cancelado = false;

    async function cargarEmails() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerEmailsRegistrados();

        if (!cancelado) {
          setEmails(datos.emails || []);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err?.mensaje || err?.message || 'Error al cargar emails');
          setEmails([]);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarEmails();

    return () => {
      cancelado = true;
    };
  }, [habilitado]);

  return { emails, cargando, error };
}
