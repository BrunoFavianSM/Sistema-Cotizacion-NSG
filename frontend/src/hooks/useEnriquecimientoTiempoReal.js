import { useEffect, useRef, useState } from 'react';
import { obtenerEstadoEnriquecimiento, obtenerTokenStream } from '../servicios/api';

const INTERVALO_POLLING_MS = 5000;
const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// El stream usa un token efímero (60s, scope limitado) emitido por el backend.
// El JWT de sesión nunca viaja en la URL.
function crearUrlStream(tokenEfimero) {
  const url = new URL(`${BASE_API}/importacion/estado/stream`);
  url.searchParams.set('token', tokenEfimero);
  return url.toString();
}

export function useEnriquecimientoTiempoReal({ activo = true } = {}) {
  const [estado, setEstado] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [modo, setModo] = useState('desconectado');
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!activo) return undefined;

    let cancelado = false;
    let eventSource = null;

    const iniciarPolling = () => {
      if (cancelado || pollingRef.current) return;
      setModo('polling');
      setConectado(false);

      const consultar = async () => {
        try {
          const nuevoEstado = await obtenerEstadoEnriquecimiento();
          if (!cancelado) setEstado(nuevoEstado);
        } catch {
          if (!cancelado) setConectado(false);
        }
      };

      consultar();
      pollingRef.current = setInterval(consultar, INTERVALO_POLLING_MS);
    };

    if (typeof EventSource === 'undefined') {
      iniciarPolling();
      return () => {
        cancelado = true;
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }

    const iniciarStream = async () => {
      try {
        const tokenEfimero = await obtenerTokenStream();
        if (cancelado || !tokenEfimero) {
          if (!cancelado) iniciarPolling();
          return;
        }

        eventSource = new EventSource(crearUrlStream(tokenEfimero));
        setModo('sse');

        eventSource.onopen = () => {
          if (!cancelado) setConectado(true);
        };

        eventSource.addEventListener('estado', (event) => {
          if (cancelado) return;
          try {
            setEstado(JSON.parse(event.data));
            setConectado(true);
          } catch {
            setConectado(false);
          }
        });

        eventSource.onerror = () => {
          if (cancelado) return;
          eventSource.close();
          iniciarPolling();
        };
      } catch {
        if (!cancelado) iniciarPolling();
      }
    };

    iniciarStream();

    return () => {
      cancelado = true;
      if (eventSource) eventSource.close();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activo]);

  return { estado, conectado, modo };
}

export default useEnriquecimientoTiempoReal;
