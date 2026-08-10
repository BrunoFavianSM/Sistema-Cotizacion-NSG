import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import ProductForm, { PRODUCTO_INICIAL } from '../componentes/admin/ProductForm';
import { CATEGORIAS_PRODUCTO, formatearCategoria } from '../dominio/categorias';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import Badge from '../componentes/ui/Badge';
import BadgeEnriquecimiento from '../componentes/ui/BadgeEnriquecimiento';
import Button from '../componentes/ui/Button';
import DataTable from '../componentes/ui/DataTable';
import ImagenProducto from '../componentes/ui/ImagenProducto';
import Modal from '../componentes/ui/Modal';
import SelectField from '../componentes/ui/SelectField';
import Paginacion from '../componentes/ui/Paginacion';
import { useAppContext } from '../contexto/AppContext';
import { useEnriquecimientoTiempoReal } from '../hooks/useEnriquecimientoTiempoReal';
import { pasosModalProducto } from '../tours/pasos/modales';
import * as api from '../servicios/api';

function normalizarValorFormulario(valor, mapa = {}) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  return mapa[texto.toUpperCase()] || mapa[texto] || texto;
}

function parseProducto(producto) {
  const formFactorNormalizado = normalizarValorFormulario(
    producto.form_factor || producto.mb_form_factor || producto.storage_form_factor || producto.psu_form_factor || producto.case_form_factor,
    {
      'MICRO-ATX': 'Micro-ATX',
      'MINI-ITX': 'Mini-ITX',
      'E-ATX': 'E-ATX',
      'ATX': 'ATX',
      'FULL-TOWER': 'Full-Tower',
    }
  );

  const tipoAlmacenamientoNormalizado = normalizarValorFormulario(producto.tipo_almacenamiento, {
    SSD_NVME: 'NVMe',
    SSD_SATA: 'SSD',
    HDD: 'HDD',
    NVME: 'NVMe',
    SSD: 'SSD',
  });

  const interfazNormalizada = normalizarValorFormulario(producto.interfaz, {
    NVME: 'NVMe',
    SATA: 'SATA III',
    GEN3: 'NVMe PCIe 3.0',
    GEN4: 'NVMe PCIe 4.0',
    GEN5: 'NVMe PCIe 5.0',
  });

  const nvmeGenNormalizado = normalizarValorFormulario(producto.nvme_gen, {
    GEN3: 'Gen 3',
    GEN4: 'Gen 4',
    GEN5: 'Gen 5',
  });

  return {
    nombre: producto.nombre || '',
    categoria: producto.subcategoria || producto.categoria || 'procesador',
    precio_base: producto.precio_base ? String(producto.precio_base) : '',
    stock: producto.stock !== null && producto.stock !== undefined ? String(producto.stock) : '',
    disponible_a_pedido: Boolean(producto.disponible_a_pedido),
    tiempo_entrega_dias: producto.tiempo_entrega_dias ? String(producto.tiempo_entrega_dias) : '',
    descripcion_tecnica: producto.descripcion_tecnica || producto.descripcion_general || '',
    imagen_url: producto.imagen_url || '',
    id_etiqueta: producto.id_etiqueta != null ? String(producto.id_etiqueta) : '',
    codigo_proveedor: producto.codigo_proveedor || '',
    // Procesador
    socket: producto.socket || '',
    arquitectura: producto.arquitectura || '',
    nucleos: producto.nucleos ? String(producto.nucleos) : '',
    hilos: producto.hilos ? String(producto.hilos) : '',
    frecuencia_base_ghz: producto.frecuencia_base_ghz ? String(producto.frecuencia_base_ghz) : '',
    frecuencia_boost_ghz: producto.frecuencia_boost_ghz ? String(producto.frecuencia_boost_ghz) : '',
    tdp: producto.tdp ? String(producto.tdp) : '',
    graficos_integrados: Boolean(producto.graficos_integrados),
    // Placa madre / GPU (chipset compartido)
    chipset: producto.chipset || producto.chipset_gpu || '',
    ram_type: producto.ram_type || '',
    form_factor: formFactorNormalizado,
    max_ram_gb: producto.max_ram_gb ? String(producto.max_ram_gb) : '',
    slots_ram: producto.slots_ram ? String(producto.slots_ram) : '',
    pcie_version: producto.pcie_version || '',
    m2_slots: producto.m2_slots ? String(producto.m2_slots) : '',
    // RAM
    capacidad_gb: producto.capacidad_gb ? String(producto.capacidad_gb) : '',
    velocidad_mhz: producto.velocidad_mhz ? String(producto.velocidad_mhz) : '',
    latencia: producto.latencia || '',
    modulos: producto.modulos || '',
    cantidad_modulos: producto.cantidad_modulos ? String(producto.cantidad_modulos) : '',
    rgb: Boolean(producto.rgb),
    // Almacenamiento
    tipo_almacenamiento: tipoAlmacenamientoNormalizado,
    interfaz: interfazNormalizada,
    velocidad_lectura_mbps: producto.velocidad_lectura_mbps ? String(producto.velocidad_lectura_mbps) : '',
    velocidad_escritura_mbps: producto.velocidad_escritura_mbps ? String(producto.velocidad_escritura_mbps) : '',
    nvme_gen: nvmeGenNormalizado,
    // GPU
    vram_gb: producto.vram_gb ? String(producto.vram_gb) : '',
    vram_tipo: producto.vram_tipo || '',
    bus_bits: producto.bus_bits ? String(producto.bus_bits) : '',
    boost_mhz: producto.boost_mhz ? String(producto.boost_mhz) : '',
    longitud_mm: producto.longitud_mm ? String(producto.longitud_mm) : '',
    fuente_recomendada_w: producto.fuente_recomendada_w ? String(producto.fuente_recomendada_w) : '',
    // Fuente
    wattage: producto.wattage ? String(producto.wattage) : '',
    certificacion: producto.certificacion || '',
    modular: producto.modular || '',
    pcie_conectores: producto.pcie_conectores ? String(producto.pcie_conectores) : '',
    sata_conectores: producto.sata_conectores ? String(producto.sata_conectores) : '',
    // Case
    compatibilidad_placa: producto.compatibilidad_placa || '',
    max_gpu_mm: producto.max_gpu_mm ? String(producto.max_gpu_mm) : '',
    max_cooler_mm: producto.max_cooler_mm ? String(producto.max_cooler_mm) : '',
    ventiladores_incluidos: producto.ventiladores_incluidos ? String(producto.ventiladores_incluidos) : '',
    color: producto.color || '',
    panel_lateral: producto.panel_lateral || '',
  };
}

function validarFormulario(formulario) {
  if (!formulario.nombre.trim()) {
    return 'El nombre es obligatorio.';
  }
  if (formulario.precio_base === '' || Number(formulario.precio_base) < 0) {
    return 'Ingresa un precio base válido.';
  }
  if (formulario.stock === '' || Number(formulario.stock) < 0) {
    return 'Ingresa un stock válido.';
  }
  if (
    formulario.disponible_a_pedido
    && (formulario.tiempo_entrega_dias === '' || Number(formulario.tiempo_entrega_dias) < 1)
  ) {
    return 'Define un tiempo de entrega válido para productos a pedido.';
  }
  return '';
}

function serializarFormulario(formulario) {
  const n = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const s = (v) => (v === '' || v === null || v === undefined ? null : String(v).trim());

  return {
    nombre: formulario.nombre.trim(),
    categoria: formulario.categoria,
    precio_base: Number(formulario.precio_base),
    stock: Number(formulario.stock),
    disponible_a_pedido: Boolean(formulario.disponible_a_pedido),
    tiempo_entrega_dias: formulario.disponible_a_pedido ? n(formulario.tiempo_entrega_dias) : null,
    descripcion_tecnica: s(formulario.descripcion_tecnica),
    imagen_url: s(formulario.imagen_url),
    // Procesador
    socket: s(formulario.socket),
    arquitectura: s(formulario.arquitectura),
    nucleos: n(formulario.nucleos),
    hilos: n(formulario.hilos),
    frecuencia_base_ghz: n(formulario.frecuencia_base_ghz),
    frecuencia_boost_ghz: n(formulario.frecuencia_boost_ghz),
    tdp: n(formulario.tdp),
    graficos_integrados: Boolean(formulario.graficos_integrados),
    // Placa madre
    chipset: s(formulario.chipset),
    ram_type: s(formulario.ram_type),
    form_factor: s(formulario.form_factor),
    max_ram_gb: n(formulario.max_ram_gb),
    slots_ram: n(formulario.slots_ram),
    pcie_version: s(formulario.pcie_version),
    m2_slots: n(formulario.m2_slots),
    // RAM
    capacidad_gb: n(formulario.capacidad_gb),
    velocidad_mhz: n(formulario.velocidad_mhz),
    latencia: s(formulario.latencia),
    modulos: s(formulario.modulos),
    cantidad_modulos: n(formulario.cantidad_modulos),
    rgb: Boolean(formulario.rgb),
    // Almacenamiento
    tipo_almacenamiento: s(formulario.tipo_almacenamiento),
    interfaz: s(formulario.interfaz),
    velocidad_lectura_mbps: n(formulario.velocidad_lectura_mbps),
    velocidad_escritura_mbps: n(formulario.velocidad_escritura_mbps),
    nvme_gen: s(formulario.nvme_gen),
    // GPU
    vram_gb: n(formulario.vram_gb),
    vram_tipo: s(formulario.vram_tipo),
    bus_bits: n(formulario.bus_bits),
    boost_mhz: n(formulario.boost_mhz),
    longitud_mm: n(formulario.longitud_mm),
    fuente_recomendada_w: n(formulario.fuente_recomendada_w),
    // Fuente
    wattage: n(formulario.wattage),
    certificacion: s(formulario.certificacion),
    modular: s(formulario.modular),
    pcie_conectores: n(formulario.pcie_conectores),
    sata_conectores: n(formulario.sata_conectores),
    // Case
    compatibilidad_placa: s(formulario.compatibilidad_placa),
    max_gpu_mm: n(formulario.max_gpu_mm),
    max_cooler_mm: n(formulario.max_cooler_mm),
    ventiladores_incluidos: n(formulario.ventiladores_incluidos),
    color: s(formulario.color),
    panel_lateral: s(formulario.panel_lateral),
  };
}

function formatearValorSpec(valor, sufijo = '') {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return `${valor}${sufijo}`;
}

function obtenerSpecsPorCategoria(producto) {
  switch (producto.categoria) {
    case 'procesador':
      return [
        ['Socket', formatearValorSpec(producto.socket)],
        ['Arquitectura', formatearValorSpec(producto.arquitectura)],
        ['Núcleos', formatearValorSpec(producto.nucleos)],
        ['Hilos', formatearValorSpec(producto.hilos)],
        ['Frecuencia base', formatearValorSpec(producto.frecuencia_base_ghz, ' GHz')],
        ['Frecuencia boost', formatearValorSpec(producto.frecuencia_boost_ghz, ' GHz')],
        ['TDP', formatearValorSpec(producto.tdp, ' W')],
        ['Gráficos integrados', formatearValorSpec(producto.graficos_integrados)],
      ];
    case 'placa_madre':
      return [
        ['Socket', formatearValorSpec(producto.socket)],
        ['Chipset', formatearValorSpec(producto.chipset)],
        ['Form factor', formatearValorSpec(producto.mb_form_factor || producto.form_factor)],
        ['Tipo de RAM', formatearValorSpec(producto.ram_type)],
        ['RAM máxima', formatearValorSpec(producto.max_ram_gb, ' GB')],
        ['Slots RAM', formatearValorSpec(producto.slots_ram)],
        ['Versión PCIe', formatearValorSpec(producto.pcie_version)],
        ['Slots M.2', formatearValorSpec(producto.m2_slots)],
      ];
    case 'ram':
      return [
        ['Tipo de RAM', formatearValorSpec(producto.ram_type)],
        ['Capacidad', formatearValorSpec(producto.capacidad_gb, ' GB')],
        ['Velocidad', formatearValorSpec(producto.velocidad_mhz, ' MHz')],
        ['Latencia', formatearValorSpec(producto.latencia)],
        ['Módulos', formatearValorSpec(producto.modulos)],
        ['Cantidad de módulos', formatearValorSpec(producto.cantidad_modulos)],
        ['RGB', formatearValorSpec(producto.rgb)],
      ];
    case 'almacenamiento':
      return [
        ['Tipo', formatearValorSpec(producto.tipo_almacenamiento)],
        ['Capacidad', formatearValorSpec(producto.capacidad_gb, ' GB')],
        ['Interfaz', formatearValorSpec(producto.interfaz)],
        ['Form factor', formatearValorSpec(producto.storage_form_factor || producto.form_factor)],
        ['Lectura', formatearValorSpec(producto.velocidad_lectura_mbps, ' MB/s')],
        ['Escritura', formatearValorSpec(producto.velocidad_escritura_mbps, ' MB/s')],
        ['Generación NVMe', formatearValorSpec(producto.nvme_gen)],
      ];
    case 'gpu':
      return [
        ['Chipset', formatearValorSpec(producto.chipset || producto.chipset_gpu)],
        ['VRAM', formatearValorSpec(producto.vram_gb, ' GB')],
        ['Tipo de VRAM', formatearValorSpec(producto.vram_tipo)],
        ['Bus', formatearValorSpec(producto.bus_bits, ' bits')],
        ['Boost clock', formatearValorSpec(producto.boost_mhz, ' MHz')],
        ['TDP', formatearValorSpec(producto.tdp, ' W')],
        ['Longitud', formatearValorSpec(producto.longitud_mm, ' mm')],
        ['Fuente recomendada', formatearValorSpec(producto.fuente_recomendada_w, ' W')],
      ];
    case 'fuente':
      return [
        ['Potencia', formatearValorSpec(producto.wattage, ' W')],
        ['Certificación', formatearValorSpec(producto.certificacion)],
        ['Modularidad', formatearValorSpec(producto.modular)],
        ['Form factor', formatearValorSpec(producto.psu_form_factor || producto.form_factor)],
        ['Conectores PCIe', formatearValorSpec(producto.pcie_conectores)],
        ['Conectores SATA', formatearValorSpec(producto.sata_conectores)],
      ];
    case 'case':
      return [
        ['Form factor', formatearValorSpec(producto.case_form_factor || producto.form_factor)],
        ['Compatibilidad placa', formatearValorSpec(producto.compatibilidad_placa)],
        ['GPU máxima', formatearValorSpec(producto.max_gpu_mm, ' mm')],
        ['Cooler máximo', formatearValorSpec(producto.max_cooler_mm, ' mm')],
        ['Ventiladores incluidos', formatearValorSpec(producto.ventiladores_incluidos)],
        ['Color', formatearValorSpec(producto.color)],
        ['Panel lateral', formatearValorSpec(producto.panel_lateral)],
      ];
    default:
      return [];
  }
}

function SelectorVista({ vistaDetallada, onChange }) {
  const opciones = [
    { valor: 'compacta', etiqueta: 'Vista compacta' },
    { valor: 'detallada', etiqueta: 'Vista detallada' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización de productos"
      className="inline-flex min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5"
    >
      {opciones.map(({ valor, etiqueta }) => {
        const activo = vistaDetallada ? valor === 'detallada' : valor === 'compacta';
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(valor === 'detallada')}
            className={[
              'min-h-11 min-w-[44px] rounded-[calc(var(--radius-sm)-2px)] px-4 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              activo
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminProductos() {
  // precio_base se almacena en USD; formatearMontoSegunMonedaVista lo convierte
  // y formatea segun la moneda de vista activa (S/ o $), reaccionando al toggle.
  const { autenticado, formatearMontoSegunMonedaVista } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorPantalla, setErrorPantalla] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [vistaDetallada, setVistaDetallada] = useState(false);
  // Task 10.2 — filtro por estado de enriquecimiento
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  // Task 10.2 — tooltip para badge ia_fallido (almacena id del producto o null)
  const [tooltipFallido, setTooltipFallido] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const limite = 50;

  // Historial de precios: { [idProducto]: { precio_anterior, total } }
  const [historialPrecios, setHistorialPrecios] = useState({});

  const [modalFormulario, setModalFormulario] = useState({ open: false, mode: 'create', producto: null });
  const [formulario, setFormulario] = useState(PRODUCTO_INICIAL);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [etiquetas, setEtiquetas] = useState([]);

  const [modalEliminar, setModalEliminar] = useState({ open: false, producto: null });

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setErrorPantalla('');
    try {
      const params = {
        page: paginaActual,
        limit: limite,
      };

      if (filtroCategoria) {
        params.categoria = filtroCategoria;
      }

      const data = await api.obtenerProductos(params);
      const lista = Array.isArray(data) ? data : data.productos || [];
      setProductos(lista);

      // Actualizar metadata de paginación
      if (data.total !== undefined) {
        setTotalProductos(data.total);
        setTotalPaginas(data.totalPaginas || 1);
      }

      // Cargar historial de precios para productos que lo tienen (Req. 3.7, 3.9)
      const conHistorial = lista.filter((p) => p.tiene_historial);
      if (conHistorial.length > 0) {
        const resultados = await Promise.allSettled(
          conHistorial.map((p) => api.obtenerHistorialPrecios(p.id))
        );
        const nuevoHistorial = {};
        resultados.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value.historial?.length > 0) {
            const idProducto = conHistorial[idx].id;
            nuevoHistorial[idProducto] = {
              precio_anterior: Number(r.value.historial[0].precio_anterior),
              total: r.value.total,
            };
          }
        });
        setHistorialPrecios(nuevoHistorial);
      } else {
        setHistorialPrecios({});
      }
    } catch {
      setErrorPantalla('No se pudieron cargar los productos. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [paginaActual, filtroCategoria, limite]);

  const categoriasDisponibles = useMemo(() => CATEGORIAS_PRODUCTO, []);

  useEffect(() => {
    if (autenticado) {
      cargarProductos();
    }
  }, [autenticado, cargarProductos]);

  // Cargar etiquetas de perfil (para el selector del formulario y el filtro).
  useEffect(() => {
    api.obtenerEtiquetas()
      .then((d) => setEtiquetas(d?.etiquetas || []))
      .catch(() => setEtiquetas([]));
  }, []);

  // Resetear página cuando cambia la categoría
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroCategoria]);

  const abrirCrear = () => {
    setFormulario(PRODUCTO_INICIAL);
    setErrorFormulario('');
    setModalFormulario({ open: true, mode: 'create', producto: null });
  };

  const abrirEditar = (producto) => {
    setFormulario(parseProducto(producto));
    setErrorFormulario('');
    setModalFormulario({ open: true, mode: 'edit', producto });
  };

  const cerrarFormulario = () => {
    if (guardando) return;
    setModalFormulario({ open: false, mode: 'create', producto: null });
    setErrorFormulario('');
  };

  const guardarProducto = async (event) => {
    event.preventDefault();
    const errorValidacion = validarFormulario(formulario);

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    setGuardando(true);
    setErrorFormulario('');

    try {
      const payload = serializarFormulario(formulario);
      const categoriaRuta = modalFormulario.producto?.subcategoria || modalFormulario.producto?.categoria || formulario.categoria;

      if (modalFormulario.mode === 'edit' && modalFormulario.producto) {
        await api.actualizarProducto(categoriaRuta, modalFormulario.producto.id, payload);
        toast.success('Producto actualizado', 'Los cambios se guardaron correctamente.');
      } else {
        await api.crearProducto(payload);
        toast.success('Producto creado', 'El producto ya está disponible en el catálogo.');
      }

      await cargarProductos();
      cerrarFormulario();
    } catch (error) {
      if (Array.isArray(error?.errores) && error.errores.length > 0) {
        const detalle = error.errores.map((item) => `${item.campo}: ${item.mensaje}`).join(' | ');
        setErrorFormulario(`Revisa estos campos: ${detalle}`);
      } else {
        setErrorFormulario(error?.mensaje || 'No se pudo guardar el producto.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (producto) => {
    setModalEliminar({ open: true, producto });
  };

  const eliminarProducto = async () => {
    if (!modalEliminar.producto) return;

    setGuardando(true);
    try {
      const categoriaRuta = modalEliminar.producto.subcategoria || modalEliminar.producto.categoria;
      await api.eliminarProducto(categoriaRuta, modalEliminar.producto.id);
      toast.success('Producto eliminado', 'El producto se retiró del catálogo.');
      setModalEliminar({ open: false, producto: null });
      await cargarProductos();
    } catch (error) {
      setErrorPantalla(error?.mensaje || 'No se pudo eliminar el producto.');
      toast.error('No se pudo eliminar', 'Verifica permisos o estado del producto e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    let lista = productos;
    if (filtroCategoria) {
      lista = lista.filter((producto) => (producto.subcategoria || producto.categoria) === filtroCategoria);
    }
    if (filtroEstado) {
      lista = lista.filter((producto) => (producto.estado_enriquecimiento || 'no_aplica') === filtroEstado);
    }
    if (filtroEtiqueta) {
      lista = lista.filter((producto) => String(producto.etiqueta || '') === filtroEtiqueta);
    }
    return lista;
  }, [productos, filtroCategoria, filtroEstado, filtroEtiqueta]);

  const columnas = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Producto', sortable: true },
    {
      key: 'categoria',
      label: 'Categoría',
      sortable: true,
      render: (row) => <span>{formatearCategoria(row.subcategoria || row.categoria)}</span>,
    },
    {
      key: 'precio_base',
      label: 'Precio',
      sortable: true,
      align: 'right',
      render: (row) => {
        const historial = historialPrecios[row.id];
        return (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              {/* Badge indicador de historial (Req. 3.9) */}
              {row.tiene_historial && (
                <span
                  title="Este producto tiene historial de cambios de precio"
                  aria-label="Tiene historial de precios"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[9px] font-bold leading-none select-none"
                >
                  H
                </span>
              )}
              <span className="font-medium text-[var(--color-text)]">
                {formatearMontoSegunMonedaVista({ montoUsd: Number(row.precio_base) })}
              </span>
            </div>
            {/* Precio anterior tachado (Req. 3.7, 3.8) */}
            {historial && (
              <span
                className="text-xs line-through text-[var(--color-text-muted)] opacity-75"
                aria-label={`Precio anterior: ${formatearMontoSegunMonedaVista({ montoUsd: historial.precio_anterior })}`}
                title={`Precio anterior: ${formatearMontoSegunMonedaVista({ montoUsd: historial.precio_anterior })}`}
              >
                {formatearMontoSegunMonedaVista({ montoUsd: historial.precio_anterior })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (row) => (
        <Badge variant={row.stock > 0 ? 'success' : 'danger'}>
          {row.stock > 0 ? `Stock ${row.stock}` : 'Sin stock'}
        </Badge>
      ),
    },
    {
      key: 'pedido',
      label: 'Pedido',
      render: (row) => (
        row.disponible_a_pedido
          ? <Badge variant="warning">Sí ({row.tiempo_entrega_dias || 0}d)</Badge>
          : <Badge variant="neutral">No</Badge>
      ),
    },
    // columna Carga de datos con BadgeEnriquecimiento
    {
      key: 'estado_enriquecimiento',
      label: 'Carga de datos',
      render: (row) => {
        const estado = row.estado_enriquecimiento || 'no_aplica';
        return (
          <div className="relative">
            <BadgeEnriquecimiento
              estado={estado}
              onClick={estado === 'fallido'
                ? () => setTooltipFallido((prev) => (prev === row.id ? null : row.id))
                : undefined}
            />
            {/* tooltip para estado 'fallido' */}
            {estado === 'fallido' && tooltipFallido === row.id && (
              <div
                role="tooltip"
                className="absolute z-10 left-0 top-full mt-1 w-64 rounded-lg surface-card border border-[var(--color-border)] p-3 shadow-lg text-xs text-[var(--color-text-muted)] leading-relaxed"
              >
                Los datos técnicos no pudieron completarse automáticamente. Puedes editar el producto manualmente o usar &ldquo;Reintentar IA&rdquo; en el panel de importación.
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => abrirEditar(row)}
            aria-label={`Editar producto ${row.nombre}`}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => confirmarEliminar(row)}
            aria-label={`Eliminar producto ${row.nombre}`}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (!autenticado) {
    return (
      <div className="surface-card p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Acceso restringido</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Debes iniciar sesión para administrar productos.</p>
      </div>
    );
  }

  // Task 10.3 — conteo de productos pendientes de enriquecimiento IA en tiempo real.
  const { estado: estadoEnriquecimiento, conectado: sseConectado, modo: modoEnriquecimiento } = useEnriquecimientoTiempoReal({ activo: autenticado });
  const pendientesLocales = productos.filter((p) => p.estado_enriquecimiento === 'pendiente').length;
  const pendientesCount = estadoEnriquecimiento?.pendientes ?? pendientesLocales;
  const enProcesoCount = estadoEnriquecimiento?.en_proceso
    ? Math.max(estadoEnriquecimiento?.pendientes_en_memoria || 0, 1)
    : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Productos"
        description="Administra catálogo, stock y disponibilidad con feedback claro en cada acción."
        actions={(
          <>
            <SelectorVista vistaDetallada={vistaDetallada} onChange={setVistaDetallada} />
            <Button variant="secondary" onClick={cargarProductos} loading={cargando}>
              Actualizar
            </Button>
            <Button onClick={abrirCrear} data-tour="productos-nuevo">Nuevo producto</Button>
          </>
        )}
      />

      {errorPantalla ? (
        <ErrorState
          title="No se cargó el catálogo"
          description={errorPantalla}
          onRetry={cargarProductos}
          retryLabel="Reintentar carga"
        />
      ) : null}

      {/* banner de productos pendientes de carga de datos */}
      {(pendientesCount > 0 || enProcesoCount > 0) && (
        <div
          role="status"
          aria-live="polite"
          className="surface-card border-l-4 border-[var(--color-warning)] p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            {sseConectado && enProcesoCount > 0 ? (
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-success)] motion-safe:animate-pulse" aria-hidden="true" />
            ) : null}
            <div className="space-y-1">
              <p className="text-sm text-[var(--color-text)]">
                {enProcesoCount > 0 ? (
                  <span className="font-semibold text-[var(--color-success)]">
                    {enProcesoCount} en carga de datos
                  </span>
                ) : null}
                {enProcesoCount > 0 && pendientesCount > 0 ? ' • ' : ''}
                {pendientesCount > 0 ? (
                  <span>
                    <strong>{pendientesCount}</strong> pendientes de carga de datos
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Actualización {modoEnriquecimiento === 'sse' && sseConectado ? 'en tiempo real' : 'periódica'}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/importar-csv')}
            className="min-h-11 text-left text-sm font-medium text-[var(--color-accent)] transition-opacity hover:opacity-80 sm:text-right"
          >
            Ver estado →
          </button>
        </div>
      )}

      {vistaDetallada ? (
        <section className="space-y-4" aria-label="Vista detallada de productos" data-tour="productos-lista">
          <div className="surface-elevated border border-[var(--color-border)] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <SelectField
                  id="filtro-categoria-productos-detallada"
                  label="Categoría"
                  value={filtroCategoria}
                  onChange={(event) => setFiltroCategoria(event.target.value)}
                  className="sm:max-w-[15rem]"
                  options={[
                    { value: '', label: 'Todas' },
                    ...categoriasDisponibles.map((categoria) => ({
                      value: categoria,
                      label: formatearCategoria(categoria),
                    })),
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="filtro-estado-enriquecimiento"
                    className="text-xs font-medium text-[var(--color-text-muted)]"
                  >
                    Carga de datos
                  </label>
                  <select
                    id="filtro-estado-enriquecimiento"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    aria-label="Filtrar por estado de enriquecimiento"
                    className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:max-w-[15rem]"
                  >
                    <option value="">Todos los estados</option>
                    <option value="csv">Datos CSV</option>
                    <option value="enriquecido">Completo</option>
                    <option value="fallido">Falló</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="no_aplica">No aplica</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="filtro-etiqueta-perfil" className="text-xs font-medium text-[var(--color-text-muted)]">
                    Etiqueta
                  </label>
                  <select
                    id="filtro-etiqueta-perfil"
                    value={filtroEtiqueta}
                    onChange={(e) => setFiltroEtiqueta(e.target.value)}
                    aria-label="Filtrar por etiqueta de perfil"
                    className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:max-w-[15rem]"
                  >
                    <option value="">Todas las etiquetas</option>
                    {etiquetas.map((et) => (
                      <option key={et.id} value={et.nombre}>{et.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{productosFiltrados.length} productos visibles</p>
            </div>
          </div>

          {cargando ? (
            <div className="surface-elevated p-10 text-center">
              <LoadingSpinner label="Cargando catálogo de productos..." />
            </div>
          ) : productosFiltrados.length === 0 ? (
            <EmptyState
              title="No hay productos para mostrar"
              description="Ajusta filtros o crea un producto nuevo para completar el catálogo."
              actionLabel="Crear producto"
              onAction={abrirCrear}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {productosFiltrados.map((producto) => {
                const historial = historialPrecios[producto.id];
                const estado = producto.estado_enriquecimiento || 'no_aplica';
                const specs = obtenerSpecsPorCategoria(producto);

                return (
                  <article
                    key={producto.id}
                    className="surface-elevated border border-[var(--color-border)] p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="neutral">{formatearCategoria(producto.categoria)}</Badge>
                            <BadgeEnriquecimiento estado={estado} />
                            {producto.tiene_historial ? <Badge variant="warning">Historial de precio</Badge> : null}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">{producto.nombre}</h2>
                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                              ID {producto.id} · Stock {producto.stock}
                              {producto.disponible_a_pedido
                                ? ` · Pedido en ${producto.tiempo_entrega_dias || 0} días`
                                : ' · Entrega inmediata'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <div className="text-left lg:text-right">
                            <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Precio base</p>
                            <p className="text-2xl font-semibold text-[var(--color-text)]">{formatearMontoSegunMonedaVista({ montoUsd: Number(producto.precio_base) })}</p>
                            {historial ? (
                              <p className="text-xs text-[var(--color-text-muted)] line-through">
                                Antes: {formatearMontoSegunMonedaVista({ montoUsd: historial.precio_anterior })}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => abrirEditar(producto)}
                              aria-label={`Editar producto ${producto.nombre}`}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => confirmarEliminar(producto)}
                              aria-label={`Eliminar producto ${producto.nombre}`}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {producto.descripcion_tecnica ? (
                        <p className="rounded-xl bg-[var(--color-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                          {producto.descripcion_tecnica}
                        </p>
                      ) : null}

                      <ImagenProducto
                        src={producto.imagen_url}
                        alt={`Imagen de ${producto.nombre}`}
                      />

                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                          Especificaciones técnicas
                        </h3>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                          {specs.map(([etiqueta, valor]) => (
                            <div
                              key={`${producto.id}-${etiqueta}`}
                              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3"
                            >
                              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                                {etiqueta}
                              </dt>
                              <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">{valor}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <DataTable
          caption="Tabla administrativa de productos"
          columns={columnas}
          data={productosFiltrados}
          loading={cargando}
          rowKey="id"
          searchKeys={['nombre', 'categoria', 'socket', 'ram_type', 'form_factor']}
          searchPlaceholder="Busca por nombre, categoría o especificación..."
          defaultSort={{ key: 'nombre', direction: 'asc' }}
          leftToolbar={(
            <div className="flex flex-wrap items-end gap-3">
              <SelectField
                id="filtro-categoria-productos-tabla"
                label="Categoría"
                value={filtroCategoria}
                onChange={(event) => setFiltroCategoria(event.target.value)}
                className="sm:max-w-[15rem]"
                options={[
                  { value: '', label: 'Todas' },
                  ...categoriasDisponibles.map((categoria) => ({
                    value: categoria,
                    label: formatearCategoria(categoria),
                  })),
                ]}
              />
              {/* Task 10.2 — filtro por estado de enriquecimiento */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="filtro-estado-enriquecimiento"
                  className="text-xs font-medium text-[var(--color-text-muted)]"
                >
                  Carga de datos
                </label>
                <select
                  id="filtro-estado-enriquecimiento"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  aria-label="Filtrar por estado de enriquecimiento"
                  className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:max-w-[15rem]"
                >
                  <option value="">Todos los estados</option>
                  <option value="csv">Datos CSV</option>
                  <option value="enriquecido">Completo</option>
                  <option value="fallido">Falló</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="no_aplica">No aplica</option>
                </select>
              </div>
            </div>
          )}
          rightToolbar={<p className="text-xs text-[var(--color-text-muted)]">{productosFiltrados.length} resultados</p>}
          loadingState={<LoadingSpinner label="Cargando catálogo de productos..." />}
          emptyState={(
            <EmptyState
              title="No hay productos para mostrar"
              description="Ajusta filtros o crea un producto nuevo para completar el catálogo."
              actionLabel="Crear producto"
              onAction={abrirCrear}
            />
          )}
        />
      )}

      {/* Paginación */}
      {!cargando && productos.length > 0 && (
        <div className="surface-elevated border border-[var(--color-border)] p-4">
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambioPagina={setPaginaActual}
          />
        </div>
      )}

      <Modal
        open={modalFormulario.open}
        onClose={cerrarFormulario}
        title={modalFormulario.mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
        description="Completa los campos y guarda los cambios."
        size="lg"
        pasosTour={pasosModalProducto}
      >
        <ProductForm
          value={formulario}
          onChange={setFormulario}
          onSubmit={guardarProducto}
          onCancel={cerrarFormulario}
          loading={guardando}
          mode={modalFormulario.mode}
          error={errorFormulario}
          categorias={categoriasDisponibles}
          etiquetas={etiquetas}
        />
      </Modal>

      <Modal
        open={modalEliminar.open}
        onClose={() => setModalEliminar({ open: false, producto: null })}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={(
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar({ open: false, producto: null })}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={eliminarProducto} loading={guardando}>
              Eliminar
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Se eliminará el producto <span className="font-semibold text-[var(--color-text)]">{modalEliminar.producto?.nombre}</span>.
        </p>
      </Modal>
    </div>
  );
}
