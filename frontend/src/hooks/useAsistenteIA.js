import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexto/AppContext';
import * as asistente from '../servicios/asistente';
import { buscarProductosCompatibles } from '../servicios/api';
import { ASISTENTE_TIMEOUT_MS } from '../servicios/api';

const MENSAJE_BIENVENIDA_BASE = {
  rol: 'assistant',
  contenido:
    'Hola, soy tu asesor de NSG. Te ayudo a cotizar una PC ideal segun tu presupuesto y uso. Empecemos por lo principal.',
  metadata: {
    quick_replies: ['Gaming', 'Oficina/Estudio', 'Edicion de video', 'Tengo presupuesto'],
    semaforo: null,
    configuracion_propuesta: null,
  },
};

const MENSAJE_BIENVENIDA_CON_CONFIG = {
  rol: 'assistant',
  contenido:
    'Hola, soy tu asesor de NSG. Veo que ya tenes componentes elegidos en el cotizador. ¿Querés que analice tu configuracion y te sugiera mejoras, o preferis armar una desde cero?',
  metadata: {
    quick_replies: ['Analiza mi configuracion', 'Empezar de cero'],
    semaforo: null,
    configuracion_propuesta: null,
  },
};

function crearMensajeBienvenida(tieneConfig = false) {
  const base = tieneConfig ? MENSAJE_BIENVENIDA_CON_CONFIG : MENSAJE_BIENVENIDA_BASE;
  return {
    id: `assistant-bienvenida-${Date.now()}`,
    rol: base.rol,
    contenido: base.contenido,
    timestamp: new Date().toISOString(),
    metadata: base.metadata,
  };
}

// Construye una versión compacta de la configuración del cotizador para enviar al
// asistente. Devuelve null si no hay ningún componente seleccionado.
function construirConfigActual(seleccion) {
  if (!seleccion || typeof seleccion !== 'object') return null;

  const comp = (p) =>
    p && (p.id || p.nombre)
      ? { id: p.id, nombre: p.nombre, precio_usd: p.precio_usd ?? p.precio_base ?? null }
      : null;

  const ram = (seleccion.ram || []).map(comp).filter(Boolean);
  const config = {
    procesador: comp(seleccion.procesador),
    placa_madre: comp(seleccion.placa_madre),
    ram,
    almacenamiento: comp(seleccion.almacenamiento),
    gpu: comp(seleccion.gpu),
    fuente: comp(seleccion.fuente),
    case: comp(seleccion.case),
  };

  const tieneAlgo =
    config.procesador || config.placa_madre || ram.length > 0 ||
    config.almacenamiento || config.gpu || config.fuente || config.case;

  return tieneAlgo ? config : null;
}

export function useAsistenteIA({ sesionId: sesionIdProp = null, usuarioId = null, activo = true } = {}) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [configuracionPropuesta, setConfiguracionPropuesta] = useState(null);
  const [semaforo, setSemaforo] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarAsesor, setMostrarAsesor] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [etapaConversacion, setEtapaConversacion] = useState('cuestionario');

  const sesionIdRef = useRef(sesionIdProp);
  const [sesionIdEstado, setSesionIdEstado] = useState(sesionIdProp);
  const inicializadoRef = useRef(false);
  const iniciandoRef = useRef(false);
  const abortControllerRef = useRef(null);

  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const { tipoCambioUsdPen, autenticado, usuario, aplicarConfiguracion: aplicarConfiguracionContexto, configuracionSeleccionada } = useAppContext();

  // Ref para leer la config del cotizador sin recrear callbacks en cada cambio.
  const configSeleccionadaRef = useRef(configuracionSeleccionada);
  useEffect(() => {
    configSeleccionadaRef.current = configuracionSeleccionada;
  }, [configuracionSeleccionada]);

  const resolverUsuarioId = useCallback(() => {
    if (usuarioId !== null && usuarioId !== undefined) return usuarioId;
    if (autenticado && usuario?.id) return usuario.id;
    return null;
  }, [usuarioId, autenticado, usuario]);

  const registrarDebug = useCallback((evento, detalle = {}) => {
    setDebugLogs((prev) => [
      ...prev.slice(-149),
      {
        ts: new Date().toISOString(),
        evento,
        detalle
      }
    ]);
  }, []);

  const sembrarBienvenida = useCallback(() => {
    const tieneConfig = !!construirConfigActual(configSeleccionadaRef.current);
    setMensajes((prev) => {
      if (prev.length > 0) return prev;
      return [crearMensajeBienvenida(tieneConfig)];
    });
    setQuickReplies(
      tieneConfig
        ? MENSAJE_BIENVENIDA_CON_CONFIG.metadata.quick_replies
        : MENSAJE_BIENVENIDA_BASE.metadata.quick_replies
    );
  }, []);

  useEffect(() => {
    if (!activo) return;
    if (inicializadoRef.current) return;
    if (iniciandoRef.current) return;

    if (sesionIdProp) {
      sesionIdRef.current = sesionIdProp;
      setSesionIdEstado(sesionIdProp);
      inicializadoRef.current = true;
      sembrarBienvenida();
      registrarDebug('sesion_reutilizada', { sesionId: sesionIdProp });
      return;
    }

    iniciandoRef.current = true;

    const iniciarSesion = async () => {
      try {
        const uid = resolverUsuarioId();
        const resultado = await asistente.nuevaSesion(uid);
        if (!montadoRef.current) return;

        if (resultado?.exito && resultado?.sesion_id) {
          sesionIdRef.current = resultado.sesion_id;
          setSesionIdEstado(resultado.sesion_id);
          inicializadoRef.current = true;
          sembrarBienvenida();
          registrarDebug('sesion_creada', { sesionId: resultado.sesion_id });
        } else {
          setError(resultado?.error || 'No se pudo iniciar la sesion del asistente. Por favor, recarga la pagina.');
          setMostrarAsesor(true);
          registrarDebug('error_sesion', { error: resultado?.error || 'fallo nuevaSesion' });
        }
      } catch (_) {
        if (!montadoRef.current) return;
        setError('No se pudo iniciar la sesion del asistente. Por favor, recarga la pagina.');
        setMostrarAsesor(true);
        registrarDebug('error_sesion', { error: 'exception nuevaSesion' });
      } finally {
        iniciandoRef.current = false;
      }
    };

    iniciarSesion();
  }, [activo, sesionIdProp, resolverUsuarioId, sembrarBienvenida]);

  const llamarConRetry = useCallback(async (fn, maxIntentos = 2) => {
    let ultimoError;
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const resultado = await fn();
        if (resultado?.exito === false) {
          ultimoError = new Error(resultado.error || 'Error del servidor');
          if (intento < maxIntentos) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }
        return resultado;
      } catch (err) {
        ultimoError = err;
        if (intento < maxIntentos) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    throw ultimoError;
  }, []);

  const enviarMensaje = useCallback(
    async (texto) => {
      if (!texto?.trim()) return;

      const sesionActual = sesionIdRef.current;
      if (!sesionActual) {
        setError('No hay sesion activa. Abre el chat e intenta de nuevo.');
        return;
      }

      const mensajeUsuario = {
        id: `user-${Date.now()}`,
        rol: 'user',
        contenido: texto.trim(),
        timestamp: new Date().toISOString(),
      };

      setMensajes((prev) => [...prev, mensajeUsuario]);
      registrarDebug('mensaje_usuario', { contenido: texto.trim() });
      setQuickReplies([]);
      setError(null);
      setCargando(true);

      // AbortController con timeout cliente para evitar que quede colgado
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), ASISTENTE_TIMEOUT_MS);

      try {
        const uid = resolverUsuarioId();
        const configActual = construirConfigActual(configSeleccionadaRef.current);
        const resultado = await llamarConRetry(
          () => asistente.enviarMensaje(sesionActual, texto.trim(), uid, configActual),
          2
        );
        registrarDebug('respuesta_api', {
          exito: !!resultado?.exito,
          tieneConfig: !!resultado?.configuracion_propuesta,
          quickReplies: Array.isArray(resultado?.quick_replies) ? resultado.quick_replies.length : 0,
          mostrarAsesor: !!resultado?.mostrar_asesor,
          etapa: resultado?.etapa || null,
          faltantes: Array.isArray(resultado?.cuestionario_faltantes) ? resultado.cuestionario_faltantes : []
        });

        if (!montadoRef.current) return;

        const mensajeAsistente = {
          id: `assistant-${Date.now()}`,
          rol: 'assistant',
          contenido: resultado.respuesta || '',
          timestamp: new Date().toISOString(),
          metadata: {
            quick_replies: resultado.quick_replies || [],
            semaforo: resultado.semaforo || null,
            configuracion_propuesta: resultado.configuracion_propuesta || null,
          },
        };

        setMensajes((prev) => {
          const ultimo = prev[prev.length - 1];
          if (
            ultimo?.rol === 'assistant' &&
            String(ultimo?.contenido || '').trim() === String(mensajeAsistente.contenido || '').trim()
          ) {
            return prev;
          }
          return [...prev, mensajeAsistente];
        });

        setQuickReplies(resultado.quick_replies || []);
        setSemaforo(resultado.semaforo || null);
        setConfiguracionPropuesta(resultado.configuracion_propuesta || null);
        setEtapaConversacion(resultado.etapa || 'cuestionario');
      } catch (err) {
        if (!montadoRef.current) return;
        const esTimeout = err?.name === 'AbortError' || err?.code === 'ECONNABORTED';
        const msg = esTimeout
          ? 'El asistente tardó demasiado en responder. Intenta de nuevo o contacta a un asesor.'
          : 'Hubo un problema al conectar con el asistente. Por favor, intenta de nuevo o contacta a un asesor.';
        setError(msg);
        setMostrarAsesor(true);
        registrarDebug('error_envio', { error: esTimeout ? 'timeout' : 'fallo enviarMensaje' });
      } finally {
        clearTimeout(timeoutId);
        abortControllerRef.current = null;
        if (montadoRef.current) {
          setCargando(false);
        }
      }
    },
    [llamarConRetry, resolverUsuarioId]
  );

  const seleccionarQuickReply = useCallback(
    (texto) => {
      setQuickReplies([]);
      enviarMensaje(texto);
      registrarDebug('quick_reply', { texto });
    },
    [enviarMensaje, registrarDebug]
  );

  const ocultarQuickReplies = useCallback(() => {
    setQuickReplies([]);
  }, []);

  const aplicarConfiguracion = useCallback(() => {
    if (configuracionPropuesta && aplicarConfiguracionContexto) {
      aplicarConfiguracionContexto(configuracionPropuesta);
    }
  }, [configuracionPropuesta, aplicarConfiguracionContexto]);

  const reiniciar = useCallback(async () => {
    setMensajes([]);
    setCargando(false);
    setQuickReplies([]);
    setConfiguracionPropuesta(null);
    setSemaforo(null);
    setError(null);
    setMostrarAsesor(false);
    setDebugLogs([]);
    setEtapaConversacion('cuestionario');
    sesionIdRef.current = null;
    setSesionIdEstado(null);
    inicializadoRef.current = false;
    iniciandoRef.current = false;

    try {
      const uid = resolverUsuarioId();
      const resultado = await asistente.nuevaSesion(uid);
      if (!montadoRef.current) return;

      if (resultado?.exito && resultado?.sesion_id) {
        sesionIdRef.current = resultado.sesion_id;
        setSesionIdEstado(resultado.sesion_id);
        inicializadoRef.current = true;
        sembrarBienvenida();
        registrarDebug('sesion_reiniciada', { sesionId: resultado.sesion_id });
      } else {
        setError(resultado?.error || 'No se pudo reiniciar la sesion. Por favor, recarga la pagina.');
        setMostrarAsesor(true);
        registrarDebug('error_reinicio', { error: resultado?.error || 'fallo reinicio' });
      }
    } catch (_) {
      if (!montadoRef.current) return;
      setError('No se pudo reiniciar la sesion. Por favor, recarga la pagina.');
      setMostrarAsesor(true);
      registrarDebug('error_reinicio', { error: 'exception reinicio' });
    }
  }, [resolverUsuarioId, sembrarBienvenida, registrarDebug]);

  /**
   * Extrae filtros de compatibilidad desde el texto del usuario.
   * Detecta menciones de socket, tipo de RAM y nombre de procesador.
   * Req. 8.5, 8.6
   */
  const extraerFiltrosCompatibilidad = useCallback((texto) => {
    const filtros = {};
    const t = texto.toLowerCase();

    // Detectar socket (LGA1700, AM5, AM4, etc.)
    const matchSocket = texto.match(/\b(LGA\s?\d{3,4}|AM[45]|AM3\+?|TR4|sTRX4|FM2\+?)\b/i);
    if (matchSocket) filtros.socket = matchSocket[1].replace(/\s/, '').toUpperCase();

    // Detectar tipo de RAM (DDR4, DDR5)
    const matchRam = texto.match(/\b(DDR[345])\b/i);
    if (matchRam) filtros.ram_tipo = matchRam[1].toUpperCase();

    // Detectar nombre de procesador (Intel i3/i5/i7/i9, Ryzen 3/5/7/9)
    const matchCpu = texto.match(/\b(i[3579]-\d{4,5}[A-Z]*|Ryzen\s*[3579]\s*\d{4}[A-Z]*|Core\s*Ultra\s*\d+)\b/i);
    if (matchCpu) filtros.procesador = matchCpu[1];

    return Object.keys(filtros).length > 0 ? filtros : null;
  }, []);

  /**
   * Detecta si el mensaje del usuario es una consulta de compatibilidad.
   * Req. 8.5
   */
  const esConsultaCompatibilidad = useCallback((texto) => {
    const t = texto.toLowerCase();
    const palabrasClave = [
      'compatible', 'compatibilidad', 'funciona con', 'sirve con',
      'socket', 'ddr4', 'ddr5', 'lga', 'am4', 'am5',
      'qué placa', 'que placa', 'qué ram', 'que ram',
      'qué procesador', 'que procesador', 'recomienda',
      'compatible con mi', 'compatible con el',
    ];
    return palabrasClave.some((kw) => t.includes(kw));
  }, []);

  /**
   * Busca productos compatibles y los agrega como mensaje del asistente.
   * Se llama cuando se detecta una consulta de compatibilidad.
   * Req. 8.5, 8.6
   */
  const buscarYMostrarCompatibles = useCallback(async (filtros) => {
    try {
      const resultado = await buscarProductosCompatibles(filtros);
      if (!montadoRef.current) return;

      const productos = resultado?.productos || [];
      const filtrosTexto = Object.entries(filtros)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      let contenido;
      if (productos.length === 0) {
        contenido = `No encontré productos compatibles con los filtros especificados (${filtrosTexto}). Te recomiendo revisar el catálogo completo o consultar con un asesor.`;
      } else {
        const lista = productos
          .slice(0, 5)
          .map((p) => {
            const specs = [];
            if (p.socket) specs.push(`Socket: ${p.socket}`);
            if (p.ram_type) specs.push(`RAM: ${p.ram_type}`);
            if (p.chipset) specs.push(`Chipset: ${p.chipset}`);
            if (p.wattage) specs.push(`Potencia: ${p.wattage}W`);
            if (p.capacidad_gb) specs.push(`Capacidad: ${p.capacidad_gb}GB`);
            const specsStr = specs.length > 0 ? ` (${specs.join(', ')})` : '';
            return `• ${p.nombre}${specsStr}`;
          })
          .join('\n');

        const total = resultado.cantidad;
        const sufijo = total > 5 ? `\n\n_Mostrando 5 de ${total} productos compatibles._` : '';
        contenido = `Encontré ${total} producto${total !== 1 ? 's' : ''} compatible${total !== 1 ? 's' : ''} con los filtros (${filtrosTexto}):\n\n${lista}${sufijo}`;
      }

      const mensajeCompatibilidad = {
        id: `assistant-compat-${Date.now()}`,
        rol: 'assistant',
        contenido,
        timestamp: new Date().toISOString(),
        metadata: {
          quick_replies: [],
          semaforo: null,
          configuracion_propuesta: null,
          productos_compatibles: productos.slice(0, 5),
          filtros_aplicados: filtros,
        },
      };

      setMensajes((prev) => [...prev, mensajeCompatibilidad]);
      registrarDebug('busqueda_compatibilidad', { filtros, total: resultado.cantidad });
    } catch (err) {
      registrarDebug('error_compatibilidad', { error: err?.mensaje || 'fallo busqueda' });
      // Silencioso: no interrumpir la experiencia si la búsqueda falla
    }
  }, [registrarDebug]);

  return {
    mensajes,
    cargando,
    quickReplies,
    configuracionPropuesta,
    semaforo,
    error,
    mostrarAsesor,
    sesionId: sesionIdEstado,
    tipoCambioUsdPen,
    debugLogs,
    etapaConversacion,
    enviarMensaje,
    seleccionarQuickReply,
    ocultarQuickReplies,
    aplicarConfiguracion,
    reiniciar,
    esConsultaCompatibilidad,
    extraerFiltrosCompatibilidad,
    buscarYMostrarCompatibles,
  };
}

export default useAsistenteIA;
