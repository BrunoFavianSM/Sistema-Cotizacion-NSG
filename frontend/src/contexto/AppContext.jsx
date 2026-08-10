/**
 * Contexto Global de AplicaciÃ³n
 *
 * Gestiona el estado global de la aplicaciÃ³n:
 * - AutenticaciÃ³n (usuario, token, login/logout)
 * - Productos disponibles
 * - ConfiguraciÃ³n seleccionada (componentes del cotizador)
 * - Margen de ganancia y tipo de cambio USD/PEN (manual o automÃ¡tico)
 *
 * Valida Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4, 14.2
 */

import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../servicios/api';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { formatearMoneda, normalizarMoneda, resolverMontoPorMoneda } from '../utilidades/moneda';

// Crear contexto
const AppContext = createContext();
const MONEDA_VISTA_STORAGE_KEY = 'nsg_moneda_vista';

// Hook personalizado para usar el contexto
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider');
  }
  return context;
};

// Provider del contexto
export const AppProvider = ({ children, value: overrideValue }) => {
  // If override value provided (for testing), use it directly
  if (overrideValue) {
    return (
      <AppContext.Provider value={overrideValue}>
        {children}
      </AppContext.Provider>
    );
  }
  return <AppProviderInternal>{children}</AppProviderInternal>;
};

// Internal provider with all state logic
const AppProviderInternal = ({ children }) => {
  // ============================================
  // ESTADO DE AUTENTICACION
  // ============================================
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const rol = usuario?.rol || null;
  const esAdmin = rol === 'admin';
  const esVendedor = rol === 'vendedor';
  const esUsuario = rol === 'usuario';
  const esInvitado = !autenticado;

  // ============================================
  // ESTADO DE PRODUCTOS
  // ============================================
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState(null);

  // ============================================
  // ESTADO DE CONFIGURACIï¿½"N SELECCIONADA
  // ============================================
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  // ============================================
  // ESTADO DE MARGEN DE GANANCIA Y TIPO DE CAMBIO
  // ============================================
  const [margenGanancia, setMargenGanancia] = useState(20);
  const [tasaIgv, setTasaIgv] = useState(18);
  const [tipoCambioUsdPen, setTipoCambioUsdPen] = useState(3.75);
  const [numeroWhatsAppVentas, setNumeroWhatsAppVentas] = useState('');

  // Modo de tipo de cambio: "manual" (valor de BD) | "automatico" (API externa)
  const [modoTipoCambio, setModoTipoCambio] = useState('manual');
  // Valor manual almacenado en BD (respaldo para modo automÃ¡tico)
  const [tipoCambioManualBD, setTipoCambioManualBD] = useState(3.75);

  // Hook de tipo de cambio â€” gestiona cachÃ©, peticiÃ³n al proxy y estados de UI
  const {
    tipoCambio: tipoCambioHook,
    cargando: cargandoTipoCambio,
    error: errorTipoCambio,
    advertencia: advertenciaTipoCambio,
    ultimaActualizacion: ultimaActualizacionTC,
    forzarActualizacion: forzarActualizacionTC,
  } = useExchangeRate({ modo: modoTipoCambio, valorManual: tipoCambioManualBD });

  const [monedaVista, setMonedaVista] = useState(() => {
    // Solo admin puede ver USD; visitantes siempre en PEN
    const guardada = localStorage.getItem(MONEDA_VISTA_STORAGE_KEY);
    return normalizarMoneda(guardada || 'PEN');
  });

  // ============================================
  // ESTADO DE COMPATIBILIDAD
  // ============================================
  const [validacionCompatibilidad, setValidacionCompatibilidad] = useState({
    compatible: true,
    errores: [],
    advertencias: []
  });

  // ============================================
  // ESTADO DE EXTRAS (productos adicionales por categorÃ­a)
  // ============================================
  const [extras, setExtras] = useState({});
  const [cargandoExtras, setCargandoExtras] = useState({});

  // ============================================
  // INICIALIZACIï¿½"N: Verificar autenticaciÃ³n
  // ============================================
  useEffect(() => {
    verificarAutenticacion();
  }, []);

  // SEGURIDAD: ante 401 (token expirado/ inválido) emitido por api.js,
  // resetear la sesión en memoria para que no "reviva" la cuenta anterior.
  useEffect(() => {
    const onExpirada = () => limpiarSesion();
    window.addEventListener('sesion:expirada', onExpirada);
    return () => window.removeEventListener('sesion:expirada', onExpirada);
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // Sincronizar tipoCambioUsdPen con el hook segÃºn el modo activo
  // Requisito 3.1, 3.3, 3.4
  useEffect(() => {
    if (modoTipoCambio === 'automatico') {
      if (tipoCambioHook && tipoCambioHook > 0) {
        setTipoCambioUsdPen(tipoCambioHook);
      }
    } else {
      setTipoCambioUsdPen(tipoCambioManualBD);
    }
  }, [modoTipoCambio, tipoCambioHook, tipoCambioManualBD]);

  /**
   * Limpia toda la sesión local (token + usuario) y resetea el estado.
   * SEGURIDAD: evita que datos de una sesión anterior "reviertan" la cuenta activa.
   * No redirige; el guard de ruta decide a dónde ir.
   */
  const limpiarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setAutenticado(false);
  };

  const verificarAutenticacion = async () => {
    try {
      const token = localStorage.getItem('token');

      // Sin token => sesión limpia garantizada (sin restos de cuentas previas).
      if (!token) {
        limpiarSesion();
        return;
      }

      // El BACKEND es la única fuente de verdad: el usuario se deriva del token
      // verificado, NO de localStorage (que puede estar desincronizado).
      const resultado = await api.verificarToken();
      if (resultado?.valido && resultado.usuario) {
        const usuarioVerificado = { ...resultado.usuario, rol: resultado.rol };
        localStorage.setItem('usuario', JSON.stringify(usuarioVerificado));
        setUsuario(usuarioVerificado);
        setAutenticado(true);
        await cargarConfiguracion();
      } else {
        // Token inválido/expirado => limpiar todo rastro de sesión.
        limpiarSesion();
      }
    } catch (error) {
      // 401/403 (expirado/ inválido) u otro error => sesión limpia, sin restos.
      limpiarSesion();
    } finally {
      setCargandoAuth(false);
    }
  };

  const cargarMargenGanancia = async () => {
    try {
      const respuesta = await api.obtenerMargenGanancia();
      if (respuesta?.exito) {
        if (typeof respuesta.margen_ganancia_default === 'number') {
          setMargenGanancia(respuesta.margen_ganancia_default);
        } else if (typeof respuesta.margen_ganancia === 'number') {
          setMargenGanancia(respuesta.margen_ganancia);
        }

        if (typeof respuesta.tasa_igv === 'number') {
          setTasaIgv(respuesta.tasa_igv);
        }

        // Actualizar solo el valor manual de BD; el useEffect de sincronizaciÃ³n
        // se encarga de reflejar el valor correcto segÃºn el modo activo.
        if (typeof respuesta.tipo_cambio_usd_pen === 'number') {
          setTipoCambioManualBD(respuesta.tipo_cambio_usd_pen);
        }
      }
      return respuesta;
    } catch (error) {
      return null;
    }
  };

  /**
   * Carga configuraciÃ³n completa desde backend en una sola peticiÃ³n.
   * Actualiza modo de tipo de cambio, valor manual de BD, margen e IGV.
   * Reemplaza a cargarMargenGanancia() para el flujo de inicializaciÃ³n.
   * Mantiene cargarMargenGanancia() por retrocompatibilidad.
   * Requisitos: 3.5
   */
  const cargarConfiguracion = async () => {
    try {
      const respuesta = await api.obtenerConfiguracion();
      if (respuesta?.exito) {
        if (typeof respuesta.margen_ganancia_default === 'number') {
          setMargenGanancia(respuesta.margen_ganancia_default);
        } else if (typeof respuesta.margen_ganancia === 'number') {
          setMargenGanancia(respuesta.margen_ganancia);
        }

        if (typeof respuesta.tasa_igv === 'number') {
          setTasaIgv(respuesta.tasa_igv);
        }

        if (typeof respuesta.tipo_cambio_usd_pen === 'number') {
          setTipoCambioManualBD(respuesta.tipo_cambio_usd_pen);
          // En modo manual, sincronizar tipoCambioUsdPen directamente
          if (respuesta.modo_tipo_cambio !== 'automatico') {
            setTipoCambioUsdPen(respuesta.tipo_cambio_usd_pen);
          }
        }

        if (respuesta.modo_tipo_cambio === 'manual' || respuesta.modo_tipo_cambio === 'automatico') {
          setModoTipoCambio(respuesta.modo_tipo_cambio);
        }

        if (typeof respuesta.whatsapp_numero_ventas === 'string') {
          setNumeroWhatsAppVentas(respuesta.whatsapp_numero_ventas);
        }
      }
      return respuesta;
    } catch (error) {
      return null;
    }
  };

  // ============================================
  // FUNCIONES DE AUTENTICACIï¿½"N
  // ============================================

  /**
   * Inicia sesiÃ³n de administrador
   */
  const login = async (correo, password, captchaToken = null) => {
    try {
      const resultado = await api.login(correo, password, captchaToken);

      if (resultado.exito) {
        setUsuario(resultado.usuario);
        setAutenticado(true);
        return { exito: true, rol: resultado.usuario?.rol };
      } else {
        return { exito: false, error: resultado.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        exito: false,
        error: error?.error || error?.mensaje || 'Error al iniciar sesión'
      };
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const registrar = async (datos) => {
    try {
      const resultado = await api.registrar(datos);

      if (resultado.exito) {
        setUsuario(resultado.usuario);
        setAutenticado(true);
        return { exito: true };
      } else {
        return { exito: false, error: resultado.error, detalles: resultado.detalles, codigo: resultado.codigo, mensaje: resultado.mensaje };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        exito: false,
        error: error?.error || error?.mensaje || 'Error al procesar el registro',
        detalles: error?.detalles,
        codigo: error?.codigo,
        mensaje: error?.mensaje
      };
    }
  };

  /**
   * Cierra sesiÃ³n del usuario
   */
  const logout = () => {
    api.logout();
    setUsuario(null);
    setAutenticado(false);
    // Visitantes siempre en PEN
    setMonedaVista('PEN');
    localStorage.setItem(MONEDA_VISTA_STORAGE_KEY, 'PEN');
  };

  // ============================================
  // FUNCIONES DE PRODUCTOS
  // ============================================

  /**
   * Carga todos los productos disponibles
   */
  const cargarProductos = async (filtros = {}) => {
    setCargandoProductos(true);
    setErrorProductos(null);
    
    try {
      const data = await api.obtenerProductos({ limit: 1000, ...filtros });
      // Backend returns { exito, cantidad, productos: [...] }
      const productosObtenidos = Array.isArray(data) ? data : (data.productos || []);
      setProductos(productosObtenidos);
      return productosObtenidos;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setErrorProductos(error.mensaje || 'Error al cargar productos');
      return [];
    } finally {
      setCargandoProductos(false);
    }
  };

  /**
   * Obtiene productos por categorÃ­a
   */
  const obtenerProductosPorCategoria = (categoria) => {
    return productos.filter(p => p.categoria === categoria);
  };

  /**
   * Obtiene productos disponibles (con stock o a pedido)
   */
  const obtenerProductosDisponibles = () => {
    return productos.filter(p => p.stock > 0 || p.disponible_a_pedido);
  };

  /**
   * Refresca un producto especÃ­fico
   */
  const refrescarProducto = async (id) => {
    try {
      const existente = productos.find((p) => p.id === id);
      if (!existente) return null;
      const categoriaRuta = existente.subcategoria || existente.categoria;
      const respuesta = await api.obtenerProductoPorId(categoriaRuta, id);
      const producto = respuesta?.producto || respuesta;
      setProductos(prev => 
        prev.map(p => p.id === id ? producto : p)
      );
      return producto;
    } catch (error) {
      console.error('Error al refrescar producto:', error);
      return null;
    }
  };

  // ============================================
  // FUNCIONES DE CONFIGURACIï¿½"N SELECCIONADA
  // ============================================

  /**
   * Selecciona un componente en la configuraciÃ³n
   */
  const seleccionarComponente = (categoria, producto) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      [categoria]: producto
    }));
  };

  /**
   * Agrega RAM a la configuraciÃ³n (puede ser mÃºltiple)
   */
  const agregarRAM = (producto) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      ram: [...prev.ram, producto]
    }));
  };

  /**
   * Elimina una RAM especÃ­fica
   */
  const eliminarRAM = (index) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      ram: prev.ram.filter((_, i) => i !== index)
    }));
  };

  /**
   * Limpia la configuraciÃ³n completa
   */
  const limpiarConfiguracion = () => {
    setConfiguracionSeleccionada({
      procesador: null,
      placa_madre: null,
      ram: [],
      almacenamiento: null,
      gpu: null,
      fuente: null,
      case: null
    });
    setValidacionCompatibilidad({
      compatible: true,
      errores: [],
      advertencias: []
    });
  };

  /**
   * Aplica una configuraciÃ³n completa (desde IA o historial)
   */
  const aplicarConfiguracion = (configuracion) => {
    const normalizarTexto = (v) => String(v || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const categoriaCompatible = (clave, producto = {}) => {
      const cat = normalizarTexto(producto.categoria || producto.subcategoria || producto.nombre_categoria || '');
      if (clave === 'procesador') return /procesador|cpu/.test(cat);
      if (clave === 'placa_madre') return (/placa|mother/).test(cat) && !/video|gpu|grafica|tarjeta/.test(cat);
      if (clave === 'ram') return (/ram|memoria|ddr/).test(cat) && !/usb|flash|pendrive/.test(cat);
      if (clave === 'almacenamiento') return /almacenamiento|ssd|hdd|disco|nvme/.test(cat);
      if (clave === 'gpu') return (/gpu|grafica|video|tarjeta/).test(cat) && !/placa madre|mother/.test(cat);
      if (clave === 'fuente') return (/fuente|psu/).test(cat) && !/video|gpu|grafica|tarjeta/.test(cat);
      if (clave === 'case') return /case|gabinete|chasis/.test(cat);
      return false;
    };

    const adaptarProducto = (p) => {
      if (!p || typeof p !== 'object') return null;
      if (p.precio_base != null) return p;
      return {
        ...p,
        precio_base: p.precio_usd ?? p.precio_base ?? 0,
      };
    };

    const resolverComponente = (valor, clave) => {
      if (!valor) return null;
      const candidatos = Array.isArray(productos) ? productos : [];

      if (typeof valor === 'object' && Number.isInteger(Number(valor.id))) {
        const porId = candidatos.find((p) => Number(p.id) === Number(valor.id));
        if (porId && categoriaCompatible(clave, porId)) return adaptarProducto(porId);
      }

      const nombre = normalizarTexto(typeof valor === 'string' ? valor : (valor.nombre || ''));
      if (!nombre) return null;
      const porNombre = candidatos.find((p) => {
        if (!categoriaCompatible(clave, p)) return false;
        const np = normalizarTexto(p.nombre || '');
        return np.includes(nombre) || nombre.includes(np);
      });
      return porNombre ? adaptarProducto(porNombre) : null;
    };

    const ramEntrada = Array.isArray(configuracion?.ram)
      ? configuracion.ram
      : (configuracion?.ram ? [configuracion.ram] : []);

    const configNormalizada = {
      procesador: resolverComponente(configuracion?.procesador, 'procesador'),
      placa_madre: resolverComponente(configuracion?.placa_madre, 'placa_madre'),
      ram: ramEntrada.map((r) => resolverComponente(r, 'ram')).filter(Boolean),
      almacenamiento: resolverComponente(configuracion?.almacenamiento, 'almacenamiento'),
      gpu: resolverComponente(configuracion?.gpu, 'gpu'),
      fuente: resolverComponente(configuracion?.fuente, 'fuente'),
      case: resolverComponente(configuracion?.case, 'case')
    };

    setConfiguracionSeleccionada(configNormalizada);
  };

  /**
   * Verifica si la configuraciÃ³n estÃ¡ completa
   */
  const configuracionCompleta = () => {
    const { procesador, placa_madre, ram, almacenamiento, gpu, fuente, case: casePC } = configuracionSeleccionada;
    return !!(procesador && placa_madre && ram.length > 0 && almacenamiento && gpu && fuente && casePC);
  };

  /**
   * Calcula el precio total de la configuraciÃ³n
   */
  const calcularPrecioTotal = () => {
    const subtotalNeto = calcularSubtotalNeto();
    const subtotalConMargen = subtotalNeto * (1 + margenGanancia / 100);
    const igvMonto = subtotalConMargen * (tasaIgv / 100);
    return subtotalConMargen + igvMonto;
  };

  const calcularSubtotalNeto = ({
    embalaje = { activo: false, precio: 0 },
    flete = { activo: false, precio: 0 },
  } = {}) => {
    let total = 0;
    
    // Sumar componentes individuales
    if (configuracionSeleccionada.procesador) total += parseFloat(configuracionSeleccionada.procesador.precio_base);
    if (configuracionSeleccionada.placa_madre) total += parseFloat(configuracionSeleccionada.placa_madre.precio_base);
    if (configuracionSeleccionada.almacenamiento) total += parseFloat(configuracionSeleccionada.almacenamiento.precio_base);
    if (configuracionSeleccionada.gpu) total += parseFloat(configuracionSeleccionada.gpu.precio_base);
    if (configuracionSeleccionada.fuente) total += parseFloat(configuracionSeleccionada.fuente.precio_base);
    if (configuracionSeleccionada.case) total += parseFloat(configuracionSeleccionada.case.precio_base);
    
    // Sumar RAM (puede ser mÃºltiple)
    configuracionSeleccionada.ram.forEach(ram => {
      total += parseFloat(ram.precio_base);
    });

    // Sumar extras
    Object.values(extras).forEach(catItems => {
      catItems.forEach(({ producto, cantidad }) => {
        total += parseFloat(producto.precio_base) * cantidad;
      });
    });

    // Sumar embalaje si estÃ¡ activo (Requisito 5.4, 5.5)
    if (embalaje.activo && typeof embalaje.precio === 'number' && embalaje.precio > 0) {
      total += embalaje.precio;
    }

    // Sumar flete si estÃ¡ activo (Requisito 6.4, 6.5)
    if (flete.activo && typeof flete.precio === 'number' && flete.precio > 0) {
      total += flete.precio;
    }

    return total;
  };

  const calcularResumenFinanciero = () => {
    const costoNetoUsd = calcularSubtotalNeto();
    const subtotalNeto = costoNetoUsd * (1 + margenGanancia / 100);
    const igvMonto = subtotalNeto * (tasaIgv / 100);
    const totalConIgv = subtotalNeto + igvMonto;

    return {
      moneda_base: 'USD',
      tipo_cambio: tipoCambioUsdPen,
      subtotal_neto: {
        usd: subtotalNeto,
        pen: subtotalNeto * tipoCambioUsdPen
      },
      igv: {
        porcentaje: tasaIgv,
        usd: igvMonto,
        pen: igvMonto * tipoCambioUsdPen
      },
      total: {
        usd: totalConIgv,
        pen: totalConIgv * tipoCambioUsdPen
      }
    };
  };

  const cambiarMonedaVista = (siguienteMoneda) => {
    // Solo admin puede cambiar a USD
    if (!autenticado && normalizarMoneda(siguienteMoneda) === 'USD') return;
    const monedaNormalizada = normalizarMoneda(siguienteMoneda);
    setMonedaVista(monedaNormalizada);
    localStorage.setItem(MONEDA_VISTA_STORAGE_KEY, monedaNormalizada);
  };

  const alternarMonedaVista = () => {
    cambiarMonedaVista(monedaVista === 'USD' ? 'PEN' : 'USD');
  };

  const obtenerMontoSegunMonedaVista = ({ montoUsd = 0, montoPen }) => {
    return resolverMontoPorMoneda({
      montoUsd,
      montoPen,
      monedaVista,
      tipoCambioUsdPen
    });
  };

  const formatearMontoSegunMonedaVista = ({ montoUsd = 0, montoPen }) => {
    const monto = obtenerMontoSegunMonedaVista({ montoUsd, montoPen });
    return formatearMoneda(monto, monedaVista);
  };

  // ============================================
  // FUNCIONES DE COMPATIBILIDAD
  // ============================================

  /**
   * Valida la compatibilidad de la configuraciÃ³n actual
   */
  const validarCompatibilidad = async () => {
    try {
      const resultado = await api.validarCompatibilidad(configuracionSeleccionada);
      setValidacionCompatibilidad(resultado);
      return resultado;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      return {
        compatible: false,
        errores: ['Error al validar compatibilidad'],
        advertencias: []
      };
    }
  };

  // ============================================
  // FUNCIONES DE EXTRAS
  // ============================================

  /**
   * Agrega un extra o incrementa su cantidad si ya existe
   */
  const agregarExtra = (categoria, producto) => {
    setExtras(prev => {
      const catItems = prev[categoria] || [];
      const existente = catItems.findIndex(item => item.producto.id === producto.id);
      if (existente >= 0) {
        const actualizado = [...catItems];
        actualizado[existente] = { ...actualizado[existente], cantidad: actualizado[existente].cantidad + 1 };
        return { ...prev, [categoria]: actualizado };
      }
      return { ...prev, [categoria]: [...catItems, { producto, cantidad: 1 }] };
    });
  };

  /**
   * Decrementa cantidad de un extra; si llega a 0, lo elimina
   */
  const quitarExtra = (categoria, idProducto) => {
    setExtras(prev => {
      const catItems = prev[categoria] || [];
      const actualizado = catItems
        .map(item => item.producto.id === idProducto ? { ...item, cantidad: item.cantidad - 1 } : item)
        .filter(item => item.cantidad > 0);
      const resultado = { ...prev, [categoria]: actualizado };
      if (actualizado.length === 0) delete resultado[categoria];
      return resultado;
    });
  };

  /**
   * Carga productos de mÃºltiples categorÃ­as extras desde la API
   */
  const cargarExtras = async (categorias = []) => {
    const faltantes = categorias.filter(c => !(c in cargandoExtras) || !cargandoExtras[c]);
    if (faltantes.length === 0) return;

    const marcas = {};
    faltantes.forEach(c => { marcas[c] = true; });
    setCargandoExtras(prev => ({ ...prev, ...marcas }));

    try {
      const resultados = await Promise.all(
        faltantes.map(c => api.obtenerProductosPorCategoria(c))
      );
      return resultados.reduce((acc, res, i) => {
        acc[faltantes[i]] = res.productos || [];
        return acc;
      }, {});
    } catch (error) {
      console.error('Error al cargar extras:', error);
      return {};
    }
  };

  /**
   * Limpia todos los extras seleccionados
   */
  const limpiarExtras = () => {
    setExtras({});
  };

  // ============================================
  // FUNCIONES DE MARGEN DE GANANCIA
  // ============================================

  /**
   * Actualiza el margen de ganancia
   */
  const actualizarMargen = async (nuevoMargen) => {
    const respuesta = await api.actualizarMargenGanancia(
      nuevoMargen,
      tasaIgv,
      tipoCambioUsdPen
    );
    if (respuesta?.exito) {
      if (typeof respuesta.margen_ganancia_default === 'number') {
        setMargenGanancia(respuesta.margen_ganancia_default);
      } else if (typeof respuesta.margen_ganancia === 'number') {
        setMargenGanancia(respuesta.margen_ganancia);
      }
      if (typeof respuesta.tasa_igv === 'number') {
        setTasaIgv(respuesta.tasa_igv);
      }
      // Actualizar solo el valor manual de BD; el useEffect de sincronizaciÃ³n
      // se encarga de reflejar el valor correcto segÃºn el modo activo.
      if (typeof respuesta.tipo_cambio_usd_pen === 'number') {
        setTipoCambioManualBD(respuesta.tipo_cambio_usd_pen);
      }
    }
    return respuesta;
  };

  const actualizarConfiguracionFinanciera = async ({ margen_ganancia_default, tasa_igv, tipo_cambio_usd_pen, whatsapp_numero_ventas }) => {
    const respuesta = await api.actualizarMargenGanancia(
      margen_ganancia_default,
      tasa_igv,
      tipo_cambio_usd_pen,
      whatsapp_numero_ventas
    );
    if (respuesta?.exito) {
      if (typeof respuesta.margen_ganancia_default === 'number') {
        setMargenGanancia(respuesta.margen_ganancia_default);
      }
      if (typeof respuesta.tasa_igv === 'number') {
        setTasaIgv(respuesta.tasa_igv);
      }
      if (typeof respuesta.whatsapp_numero_ventas === 'string') {
        setNumeroWhatsAppVentas(respuesta.whatsapp_numero_ventas);
      }
      // Actualizar solo el valor manual de BD; el useEffect de sincronizaciÃ³n
      // se encarga de reflejar el valor correcto segÃºn el modo activo.
      if (typeof respuesta.tipo_cambio_usd_pen === 'number') {
        setTipoCambioManualBD(respuesta.tipo_cambio_usd_pen);
      }
    }
    return respuesta;
  };

  // ============================================
  // VALOR DEL CONTEXTO
  // ============================================
  const value = {
    // Autenticación
    usuario,
    autenticado,
    cargandoAuth,
    rol,
    esAdmin,
    esVendedor,
    esUsuario,
    esInvitado,
    login,
    logout,
    registrar,
    verificarAutenticacion,

    // Productos
    productos,
    cargandoProductos,
    errorProductos,
    cargarProductos,
    obtenerProductosPorCategoria,
    obtenerProductosDisponibles,
    refrescarProducto,

    // ConfiguraciÃ³n seleccionada
    configuracionSeleccionada,
    setConfiguracionSeleccionada,
    seleccionarComponente,
    agregarRAM,
    eliminarRAM,
    limpiarConfiguracion,
    aplicarConfiguracion,
    configuracionCompleta,
    calcularPrecioTotal,

    // Compatibilidad
    validacionCompatibilidad,
    validarCompatibilidad,

    // Margen de ganancia y tipo de cambio
    margenGanancia,
    tasaIgv,
    tipoCambioUsdPen,
    // Número de WhatsApp de ventas (para confirmar cotizaciones)
    numeroWhatsAppVentas,
    // Tipo de cambio â€” modo y estados del hook (Requisitos 3.1â€“3.6)
    modoTipoCambio,
    cargandoTipoCambio,
    errorTipoCambio,
    advertenciaTipoCambio,
    ultimaActualizacionTC,
    forzarActualizacionTC,
    monedaVista,
    cambiarMonedaVista,
    alternarMonedaVista,
    obtenerMontoSegunMonedaVista,
    formatearMontoSegunMonedaVista,
    actualizarMargen,
    actualizarConfiguracionFinanciera,
    calcularResumenFinanciero,
    cargarMargenGanancia,
    cargarConfiguracion,

    // Extras
    extras,
    cargandoExtras,
    agregarExtra,
    quitarExtra,
    cargarExtras,
    limpiarExtras,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;


