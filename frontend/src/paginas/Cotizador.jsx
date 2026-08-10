import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AsistenteIA from '../componentes/AsistenteIA';
import Button from '../componentes/ui/Button';
import ImagenProducto from '../componentes/ui/ImagenProducto';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import SuccessState from '../componentes/feedback/SuccessState';
import { useToast } from '../componentes/feedback/ToastProvider';
import SeccionEmbalaje from '../componentes/cotizador/SeccionEmbalaje';
import SeccionFlete from '../componentes/cotizador/SeccionFlete';
import ResumenFinancieroAdmin from '../componentes/cotizador/ResumenFinancieroAdmin';
import PanelComparador from '../componentes/cotizador/PanelComparador';
import DiagramaCompatibilidad from '../componentes/cotizador/DiagramaCompatibilidad';
import AnalizadorPresupuesto from '../componentes/cotizador/AnalizadorPresupuesto';
import BalanceFinal from '../componentes/cotizador/BalanceFinal';
import { useAppContext } from '../contexto/AppContext';
import { useComparador } from '../hooks/useComparador';
import { useClienteAutocompletado } from '../hooks/useClienteAutocompletado';
import { useEmailsRegistrados } from '../hooks/useEmailsRegistrados';
import usePersistenciaSeleccion from '../hooks/usePersistenciaSeleccion';
import * as api from '../servicios/api';
import { etiquetaMonedaBase, formatearMoneda } from '../utilidades/moneda';
import { calcularResumenFinancieroAdmin } from '../utilidades/calcularResumenFinancieroAdmin';
import { construirEnlaceWhatsApp, construirMensajeConfirmacion } from '../utilidades/whatsapp';

const PASOS = [
  { id: 'procesador', nombre: 'Procesador', categoria: 'procesador' },
  { id: 'placa_madre', nombre: 'Placa madre', categoria: 'placa_madre' },
  { id: 'ram', nombre: 'Memoria RAM', categoria: 'ram' },
  { id: 'almacenamiento', nombre: 'Almacenamiento', categoria: 'almacenamiento' },
  { id: 'gpu', nombre: 'Tarjeta grafica', categoria: 'gpu' },
  { id: 'fuente', nombre: 'Fuente de poder', categoria: 'fuente' },
  { id: 'case', nombre: 'Case', categoria: 'case' },
  { id: 'extras', nombre: 'Otros', categoria: null },
];

const PASOS_COMPONENTES = PASOS.slice(0, 7);

const SUBSECCIONES_EXTRAS = [
  { titulo: 'Perifericos', categorias: ['mouse', 'teclado', 'mousepad', 'webcam'] },
  { titulo: 'Audio', categorias: ['auricular', 'parlante'] },
  { titulo: 'Software', categorias: ['software_windows', 'software_office', 'software_antivirus'] },
  { titulo: 'Almacenamiento externo', categorias: ['almacenamiento_externo'] },
  { titulo: 'Energia', categorias: ['ups', 'estabilizador'] },
  { titulo: 'Monitor', categorias: ['monitor'] },
  { titulo: 'Refrigeracion', categorias: ['cooler_aire', 'cooler_liquido'] },
  { titulo: 'Conectividad', categorias: ['conectividad'] },
];

function esEmailValido(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim().toLowerCase());
}

function normalizarTelefono(telefono) {
  return String(telefono || '')
    .replace(/[^\d+]/g, '')
    .trim();
}

function obtenerEstadoStock(producto) {
  if (producto.stock > 0) {
    return { label: `Stock ${producto.stock}`, className: 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]' };
  }
  if (producto.disponible_a_pedido) {
    return { label: 'A pedido', className: 'bg-[color:rgba(255,214,10,0.15)] text-[var(--color-warning)]' };
  }
  return { label: 'Sin stock', className: 'bg-[color:rgba(255,69,58,0.15)] text-[var(--color-danger)]' };
}

function agruparRam(rams) {
  return rams.reduce((acc, ram) => {
    if (!acc[ram.id]) {
      acc[ram.id] = { producto: ram, cantidad: 1 };
    } else {
      acc[ram.id].cantidad += 1;
    }
    return acc;
  }, {});
}

function normalizarTexto(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obtenerTextoProducto(producto) {
  return `${producto?.nombre || ''} ${producto?.descripcion_tecnica || ''}`;
}

function capitalizarPrimeraLetra(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extraerMarca(producto) {
  if (producto?.marca && producto.marca.trim()) {
    const marcaBd = producto.marca.trim();
    if (marcaBd.toLowerCase() === 'wd' || marcaBd.toLowerCase() === 'western digital') return 'WD';
    return capitalizarPrimeraLetra(marcaBd);
  }

  const nombre = String(producto?.nombre || '').trim();
  if (!nombre) return 'Otros';

  const marcasConocidas = [
    'be quiet!',
    'cooler master',
    'lian li',
    'g.skill',
    'wd',
    'western digital',
    'intel',
    'amd',
    'asus',
    'msi',
    'gigabyte',
    'asrock',
    'corsair',
    'kingston',
    'teamgroup',
    'crucial',
    'samsung',
    'seagate',
    'nvidia',
    'evga',
    'thermaltake',
    'seasonic',
    'nzxt',
    'fractal',
    'phanteks',
    'montech',
    'deepcool',
    'patriot',
  ];

  const normalizado = normalizarTexto(nombre);
  const marcaConocida = marcasConocidas.find((marca) => normalizado.startsWith(marca));
  if (marcaConocida) {
    if (marcaConocida === 'wd' || marcaConocida === 'western digital') return 'WD';
    if (marcaConocida === 'be quiet!') return 'be quiet!';
    if (marcaConocida === 'cooler master') return 'Cooler Master';
    if (marcaConocida === 'lian li') return 'Lian Li';
    if (marcaConocida === 'g.skill') return 'G.Skill';
    return marcaConocida.charAt(0).toUpperCase() + marcaConocida.slice(1);
  }

  const primeraPalabra = nombre.split(/\s+/)[0] || 'Otros';
  return primeraPalabra.replace(/[^\w!+.-]/g, '');
}

function extraerModeloProcesador(producto) {
  const texto = obtenerTextoProducto(producto);
  const matchCore = texto.match(/Core\s+i[3579]/i);
  if (matchCore) return matchCore[0].replace(/\s+/g, ' ');

  const matchRyzen = texto.match(/Ryzen\s+[3579]/i);
  if (matchRyzen) return matchRyzen[0].replace(/\s+/g, ' ');

  if (/threadripper/i.test(texto)) return 'Threadripper';
  if (/celeron/i.test(texto)) return 'Celeron';
  if (/pentium/i.test(texto)) return 'Pentium';

  return 'Otros modelos';
}

function extraerFrecuenciaRam(producto) {
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d{4,5})\s*(?:mhz|mt\/s|mts)/i);
  return match ? `${match[1]} MHz` : 'No especificado';
}

function extraerCapacidadRam(producto) {
  const texto = obtenerTextoProducto(producto);
  // Busca el total de GB del kit, ej: "32GB", "16GB (2x8GB)" → toma el primer número mayor
  const matchKit = texto.match(/(\d+)\s*GB\s*\(\d+x\d+GB\)/i);
  if (matchKit) return `${matchKit[1]} GB`;
  const matchSimple = texto.match(/(\d+)\s*GB/i);
  if (matchSimple) return `${matchSimple[1]} GB`;
  return 'No especificado';
}

function extraerCapacidadAlmacenamiento(producto) {
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
  return match ? `${match[1]}${String(match[2]).toUpperCase()}` : 'No especificado';
}

function extraerTipoAlmacenamiento(producto) {
  const texto = normalizarTexto(obtenerTextoProducto(producto));
  if (texto.includes('m.2') || texto.includes('m2') || texto.includes('nvme')) return 'M.2 / NVMe';
  if (texto.includes('hdd') || texto.includes('rpm')) return 'HDD';
  if (texto.includes('ssd')) return 'SSD';
  return 'Otros';
}

function placaSoportaAlmacenamiento(placaMadre, productoAlmacenamiento) {
  if (!placaMadre) return true;
  const tipo = extraerTipoAlmacenamiento(productoAlmacenamiento);
  if (tipo !== 'M.2 / NVMe') return true;

  const textoPlaca = normalizarTexto(obtenerTextoProducto(placaMadre));
  if (!textoPlaca) return true;

  const noSoporta = /(sin m\.?2|sin nvme|no m\.?2|no nvme)/.test(textoPlaca);
  if (noSoporta) return false;

  const soporta = /(m\.?2|nvme|pcie)/.test(textoPlaca);
  if (soporta) return true;

  return true;
}

function normalizarFormFactor(valor) {
  if (!valor) return null;
  const texto = String(valor).toLowerCase().replace(/\s+/g, '').replace('_', '-');
  if (texto.includes('mini-itx') || texto === 'itx') return 'Mini-ITX';
  if (texto.includes('micro-atx') || texto.includes('matx')) return 'Micro-ATX';
  if (texto === 'atx' || texto.includes('/atx') || texto.includes('atx/')) return 'ATX';
  return valor;
}

function parsearFormFactors(descripcion) {
  const ff = [];
  const desc = String(descripcion || '').toLowerCase();
  
  if (desc.includes('mini-itx')) ff.push('Mini-ITX');
  if (desc.includes('micro-atx') || desc.includes('matx')) ff.push('Micro-ATX');
  
  const atxMatch = desc.match(/(?:^|\s|case\s)atx(?:\s|$|,|\/)/);
  if (atxMatch) ff.push('ATX');
  
  if (ff.includes('ATX')) {
    if (!ff.includes('Micro-ATX')) ff.push('Micro-ATX');
    if (!ff.includes('Mini-ITX')) ff.push('Mini-ITX');
  }
  
  return ff.length > 0 ? ff : ['ATX', 'Micro-ATX', 'Mini-ITX'];
}


function extraerSerieGPU(producto) {
  const texto = normalizarTexto(obtenerTextoProducto(producto));
  const rtx = texto.match(/rtx\s*(\d{4})/);
  if (rtx) return `RTX ${rtx[1].charAt(0)}0`;

  const rx = texto.match(/rx\s*(\d{4})/);
  if (rx) return `RX ${rx[1].slice(0, 2)}00`;

  const gtx = texto.match(/gtx\s*(\d{3,4})/);
  if (gtx) return `GTX ${gtx[1].charAt(0)}00`;

  return 'Otras series';
}

function extraerPotenciaFuente(producto) {
  if (producto?.wattage) return `${producto.wattage} W`;
  const texto = obtenerTextoProducto(producto);
  const match = texto.match(/(\d{3,4})\s*w/i);
  return match ? `${match[1]} W` : 'No especificado';
}

function extraerValoresUnicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

/**
 * Ordena una lista de productos por precio_base.
 * Función pura: no modifica la lista original.
 * @param {Array} productos
 * @param {'relevancia'|'menor'|'mayor'} orden
 * @returns {Array}
 */
function ordenarProductos(productos, orden) {
  if (orden === 'relevancia') return productos;
  return [...productos].sort((a, b) =>
    orden === 'menor'
      ? a.precio_base - b.precio_base
      : b.precio_base - a.precio_base
  );
}

function valorBooleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const normalizado = valor.trim().toLowerCase();
    return ['1', 'si', 'true', 'yes', 'y'].includes(normalizado);
  }
  return false;
}

function StepIcon({ pasoId, className = 'h-4 w-4' }) {
  const baseProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
  };

  switch (pasoId) {
    case 'procesador':
      return (
        <svg {...baseProps}>
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case 'placa_madre':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="6" height="6" rx="1" />
          <path d="M16 7h1M16 10h1M16 13h1M8 16h8" />
        </svg>
      );
    case 'ram':
      return (
        <svg {...baseProps}>
          <rect x="2" y="8" width="20" height="8" rx="2" />
          <path d="M6 11h1M10 11h1M14 11h1M18 11h1M5 16v2M9 16v2M13 16v2M17 16v2" />
        </svg>
      );
    case 'almacenamiento':
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="16.5" cy="12" r="1.5" />
          <path d="M7 12h5" />
        </svg>
      );
    case 'gpu':
      return (
        <svg {...baseProps}>
          <rect x="2" y="7" width="17" height="10" rx="2" />
          <circle cx="8.5" cy="12" r="2.2" />
          <path d="M19 10h3M19 14h3M5 17v2M9 17v2M13 17v2" />
        </svg>
      );
    case 'fuente':
      return (
        <svg {...baseProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="10" cy="12" r="3" />
          <path d="M15 9h3M15 12h3M15 15h3" />
        </svg>
      );
    case 'case':
      return (
        <svg {...baseProps}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M10 6h4M12 18v.01" />
        </svg>
      );
    case 'extras':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

function formatearValorDetalle(valor, sufijo = '') {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return `${valor}${sufijo}`;
}

function obtenerSpecsDetalladasProducto(producto, pasoId) {
  switch (pasoId) {
    case 'procesador':
      return [
        ['Socket', formatearValorDetalle(producto.socket)],
        ['Arquitectura', formatearValorDetalle(producto.arquitectura)],
        ['Núcleos', formatearValorDetalle(producto.nucleos)],
        ['Hilos', formatearValorDetalle(producto.hilos)],
        ['Base', formatearValorDetalle(producto.frecuencia_base_ghz, ' GHz')],
        ['Boost', formatearValorDetalle(producto.frecuencia_boost_ghz, ' GHz')],
        ['TDP', formatearValorDetalle(producto.tdp, ' W')],
        ['iGPU', formatearValorDetalle(valorBooleano(producto.graficos_integrados))],
      ];
    case 'placa_madre':
      return [
        ['Socket', formatearValorDetalle(producto.socket)],
        ['Chipset', formatearValorDetalle(producto.chipset)],
        ['Form factor', formatearValorDetalle(producto.mb_form_factor || producto.form_factor)],
        ['RAM', formatearValorDetalle(producto.ram_type)],
        ['RAM máxima', formatearValorDetalle(producto.max_ram_gb, ' GB')],
        ['Slots RAM', formatearValorDetalle(producto.slots_ram)],
        ['PCIe', formatearValorDetalle(producto.pcie_version)],
        ['M.2', formatearValorDetalle(producto.m2_slots)],
      ];
    case 'ram':
      return [
        ['Tipo', formatearValorDetalle(producto.ram_type)],
        ['Capacidad', formatearValorDetalle(producto.capacidad_gb, ' GB')],
        ['Velocidad', formatearValorDetalle(producto.velocidad_mhz, ' MHz')],
        ['Latencia', formatearValorDetalle(producto.latencia)],
        ['Módulos', formatearValorDetalle(producto.modulos)],
        ['Cantidad', formatearValorDetalle(producto.cantidad_modulos)],
        ['RGB', formatearValorDetalle(valorBooleano(producto.rgb))],
      ];
    case 'almacenamiento':
      return [
        ['Tipo', formatearValorDetalle(producto.tipo_almacenamiento)],
        ['Capacidad', formatearValorDetalle(producto.capacidad_gb, ' GB')],
        ['Interfaz', formatearValorDetalle(producto.interfaz)],
        ['Form factor', formatearValorDetalle(producto.storage_form_factor || producto.form_factor)],
        ['Lectura', formatearValorDetalle(producto.velocidad_lectura_mbps, ' MB/s')],
        ['Escritura', formatearValorDetalle(producto.velocidad_escritura_mbps, ' MB/s')],
        ['NVMe', formatearValorDetalle(producto.nvme_gen)],
      ];
    case 'gpu':
      return [
        ['Chipset', formatearValorDetalle(producto.chipset || producto.chipset_gpu)],
        ['VRAM', formatearValorDetalle(producto.vram_gb, ' GB')],
        ['Tipo VRAM', formatearValorDetalle(producto.vram_tipo)],
        ['Bus', formatearValorDetalle(producto.bus_bits, ' bits')],
        ['Boost', formatearValorDetalle(producto.boost_mhz, ' MHz')],
        ['TDP', formatearValorDetalle(producto.tdp, ' W')],
        ['Longitud', formatearValorDetalle(producto.longitud_mm, ' mm')],
        ['Fuente sugerida', formatearValorDetalle(producto.fuente_recomendada_w, ' W')],
      ];
    case 'fuente':
      return [
        ['Potencia', formatearValorDetalle(producto.wattage, ' W')],
        ['Certificación', formatearValorDetalle(producto.certificacion)],
        ['Modularidad', formatearValorDetalle(producto.modular)],
        ['Form factor', formatearValorDetalle(producto.psu_form_factor || producto.form_factor)],
        ['PCIe', formatearValorDetalle(producto.pcie_conectores)],
        ['SATA', formatearValorDetalle(producto.sata_conectores)],
      ];
    case 'case':
      return [
        ['Form factor', formatearValorDetalle(producto.case_form_factor || producto.form_factor)],
        ['Compatibilidad placa', formatearValorDetalle(producto.compatibilidad_placa)],
        ['GPU máxima', formatearValorDetalle(producto.max_gpu_mm, ' mm')],
        ['Cooler máximo', formatearValorDetalle(producto.max_cooler_mm, ' mm')],
        ['Ventiladores', formatearValorDetalle(producto.ventiladores_incluidos)],
        ['Color', formatearValorDetalle(producto.color)],
        ['Panel lateral', formatearValorDetalle(producto.panel_lateral)],
      ];
    default:
      return [];
  }
}

function SelectorVistaProductos({ vistaDetallada, onChange }) {
  const opciones = [
    { valor: 'compacta', etiqueta: 'Vista compacta' },
    { valor: 'detallada', etiqueta: 'Vista detallada' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualización de productos"
      className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5"
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
              'min-h-[44px] min-w-[44px] rounded-[calc(var(--radius-sm)-2px)] px-4 py-2 text-sm font-medium transition-colors duration-higNormal ease-hig',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
              activo
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}

const NOMBRE_CATEGORIA = {
  mouse: 'Mouse',
  teclado: 'Teclado',
  mousepad: 'Mousepad',
  webcam: 'Webcam',
  auricular: 'Auricular',
  parlante: 'Parlante',
  software_windows: 'Windows',
  software_office: 'Office',
  software_antivirus: 'Antivirus',
  almacenamiento_externo: 'Almac. externo',
  ups: 'UPS',
  estabilizador: 'Estabilizador',
  monitor: 'Monitor',
  cooler_aire: 'Cooler aire',
  cooler_liquido: 'Cooler líquido',
  conectividad: 'Conectividad',
};

function ExtrasAccordion({ subseccion, extras, cargarExtras, cargandoExtras, agregarExtra, quitarExtra, formatearMontoSegunMonedaVista, esInvitado }) {
  const [abierta, setAbierta] = useState(false);
  const [productosLocales, setProductosLocales] = useState({});

  const totalExtrasSubseccion = subseccion.categorias.reduce((sum, cat) => {
    const items = extras[cat] || [];
    return sum + items.reduce((s, { producto, cantidad }) => s + parseFloat(producto.precio_base) * cantidad, 0);
  }, 0);

  const cantidadTotalItems = subseccion.categorias.reduce((sum, cat) => {
    const items = extras[cat] || [];
    return sum + items.reduce((s, { cantidad }) => s + cantidad, 0);
  }, 0);

  const toggleAbrir = async () => {
    const nuevoEstado = !abierta;
    setAbierta(nuevoEstado);
    if (nuevoEstado) {
      const faltantes = subseccion.categorias.filter(c => !productosLocales[c]);
      if (faltantes.length > 0) {
        const resultado = await cargarExtras(faltantes);
        if (resultado) {
          setProductosLocales(prev => ({ ...prev, ...resultado }));
        }
      }
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={toggleAbrir}
        aria-expanded={abierta}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-higNormal hover:bg-[var(--color-surface-hover)]"
      >
        <div className="flex items-center gap-3">
          <svg className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-higNormal ${abierta ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-sm font-semibold text-[var(--color-text)]">{subseccion.titulo}</span>
          {cantidadTotalItems > 0 && (
            <span className="inline-flex rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-white">{cantidadTotalItems}</span>
          )}
        </div>
        {totalExtrasSubseccion > 0 && (
          <span className="text-sm font-medium text-[var(--color-accent)]">
            +{formatearMontoSegunMonedaVista({ montoUsd: totalExtrasSubseccion })}
          </span>
        )}
      </button>

      {abierta && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-4">
          {subseccion.categorias.map(cat => {
            const productosCat = productosLocales[cat] || [];
            const cargando = cargandoExtras[cat] && productosCat.length === 0;
            const itemsSeleccionados = extras[cat] || [];

            return (
              <div key={cat}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{NOMBRE_CATEGORIA[cat] || cat}</h4>
                {cargando ? (
                  <p className="text-xs text-[var(--color-text-muted)] animate-pulse">Cargando...</p>
                ) : productosCat.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">Sin productos disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {productosCat.map(producto => {
                      const seleccionado = itemsSeleccionados.find(i => i.producto.id === producto.id);
                      const cantidad = seleccionado?.cantidad || 0;
                      const stockInfo = obtenerEstadoStock(producto);

                      return (
                        <div key={producto.id} className={`flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border p-3 transition-all duration-higNormal ${cantidad > 0 ? 'border-[var(--color-accent)] bg-[color:rgba(0,122,255,0.04)]' : 'border-[var(--color-border)]'}`}>
                          <div className="py-2.5">
                            <p className="line-clamp-3 text-sm font-medium leading-relaxed text-[var(--color-text)]">
                              {capitalizarPrimeraLetra(producto.nombre)}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs font-semibold text-[var(--color-accent)]">
                                {esInvitado ? (
                                  <span className="text-[var(--color-text-muted)]">Inicia sesión para ver precio</span>
                                ) : (
                                  formatearMontoSegunMonedaVista({ montoUsd: producto.precio_base })
                                )}
                              </span>
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockInfo.className}`}>{stockInfo.label}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => quitarExtra(cat, producto.id)}
                              disabled={cantidad === 0}
                              aria-label={`Quitar ${producto.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-sm font-bold transition-colors duration-higFast hover:bg-[var(--color-surface-hover)] disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-semibold tabular-nums text-[var(--color-text)]">{cantidad}</span>
                            <button
                              type="button"
                              onClick={() => agregarExtra(cat, producto)}
                              aria-label={`Agregar ${producto.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-sm font-bold transition-colors duration-higFast hover:bg-[var(--color-surface-hover)]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Cotizador() {
  const {
    configuracionSeleccionada,
    setConfiguracionSeleccionada,
    seleccionarComponente,
    agregarRAM,
    eliminarRAM,
    validarCompatibilidad,
    validacionCompatibilidad,
    calcularPrecioTotal,
    cargarProductos,
    productos,
    cargandoProductos,
    errorProductos,
    limpiarConfiguracion,
    autenticado,
    esAdmin,
    esVendedor,
    esInvitado,
    margenGanancia,
    tasaIgv,
    tipoCambioUsdPen,
    cargandoTipoCambio,
    calcularResumenFinanciero,
    monedaVista,
    formatearMontoSegunMonedaVista,
    numeroWhatsAppVentas,
    extras,
    cargandoExtras,
    agregarExtra,
    quitarExtra,
    cargarExtras,
    limpiarExtras,
  } = useAppContext();

  const navigate = useNavigate();
  const toast = useToast();
  // Privilegiado = admin o vendedor: cotizan PARA un cliente, así que ingresan/
  // seleccionan los datos del cliente (el correo es obligatorio). El rol 'usuario'
  // (cliente) NO usa el formulario: su identidad sale del token.
  const esPrivilegiado = esAdmin || esVendedor;

  // ── Comparador de productos (Requisitos 6.3, 6.4) ────────────────────────
  const {
    productosComparar,
    errorLimite: errorComparador,
    agregarAComparador,
    quitarDeComparador,
    limpiarComparador,
  } = useComparador();

  // ── Persistencia de selección en localStorage (Requisitos 3.1–3.7) ───────
  const { limpiarPersistencia } = usePersistenciaSeleccion(
    configuracionSeleccionada,
    setConfiguracionSeleccionada,
    productos
  );

  // Mostrar toast cuando se alcanza el límite del comparador (Req. 6.4)
  // Cargar etiquetas de perfil para el filtro del cotizador.
  useEffect(() => {
    api.obtenerEtiquetas()
      .then((d) => setEtiquetasDisponibles(d?.etiquetas || []))
      .catch(() => setEtiquetasDisponibles([]));
  }, []);

  useEffect(() => {
    if (errorComparador) {
      toast.warning('Límite del comparador', errorComparador);
    }
  }, [errorComparador]);

  const [pasoActual, setPasoActual] = useState(0);
  const [vistaDetalladaProductos, setVistaDetalladaProductos] = useState(false);
  // soloCompatibles: true → muestra solo productos compatibles con la configuración actual
  // false → muestra todos los productos (incluyendo incompatibles con badge de advertencia)
  const [soloCompatibles, setSoloCompatibles] = useState(true);
  // ordenPrecio: 'relevancia' | 'menor' | 'mayor' — persiste entre pasos (Req. 10.9)
  const [ordenPrecio, setOrdenPrecio] = useState('relevancia');
  // Filtro global por etiqueta de perfil (Básico/Medio/Avanzado/Gamer Full)
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('all');
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([]);
  // Multi-PC: número de equipos iguales a cotizar (multiplicador)
  const [cantidadEquipos, setCantidadEquipos] = useState(1);
  const [filtrosPaso, setFiltrosPaso] = useState({
    procesadorMarca: 'all',
    procesadorModelo: 'all',
    placaMarca: 'all',
    ramMarca: 'all',
    ramFrecuencia: 'all',
    ramCapacidad: 'all',
    almacenamientoMarca: 'all',
    almacenamientoCapacidad: 'all',
    almacenamientoTipo: 'all',
    gpuMarca: 'all',
    gpuSerie: 'all',
    fuenteMarca: 'all',
    fuentePotencia: 'all',
    caseMarca: 'all',
  });
  const [generando, setGenerando] = useState(false);
  const [cotizacionGenerada, setCotizacionGenerada] = useState(null);
  const [errorGenerar, setErrorGenerar] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [apellidosCliente, setApellidosCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [intentoGenerar, setIntentoGenerar] = useState(false);

  // ── Estados para combobox de emails ───────────────────────────────────────
  const [mostrarDropdownEmails, setMostrarDropdownEmails] = useState(false);
  const [emailSeleccionadoIndex, setEmailSeleccionadoIndex] = useState(-1);
  const dropdownEmailsRef = useRef(null);

  // ── Lista de emails registrados para combobox ─────────────────────────────
  // Solo admin/vendedor: el endpoint expone PII y requiere ese rol en backend
  const { emails: emailsRegistrados } = useEmailsRegistrados(esAdmin || esVendedor);

  // Filtrar emails según lo que el usuario escribe
  const emailsFiltrados = useMemo(() => {
    if (!emailCliente || emailCliente.length < 1) return emailsRegistrados;
    const busqueda = emailCliente.toLowerCase();
    return emailsRegistrados.filter(email =>
      email.toLowerCase().includes(busqueda)
    );
  }, [emailCliente, emailsRegistrados]);

  // Scroll automático cuando cambia la selección con teclado
  useEffect(() => {
    if (emailSeleccionadoIndex >= 0 && dropdownEmailsRef.current) {
      const selectedElement = dropdownEmailsRef.current.children[emailSeleccionadoIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [emailSeleccionadoIndex]);

  // ── Autocompletado de datos del cliente ──────────────────────────────────
  // Buscar por email o teléfono cuando el usuario escribe en cualquiera de los dos campos
  const valorBusquedaEmail = emailCliente.trim();
  const valorBusquedaTelefono = telefonoCliente.trim();

  // Activar búsqueda si hay al menos 3 caracteres en email O en teléfono
  const debeActivarBusqueda = esPrivilegiado && (
    (valorBusquedaEmail.length >= 3) || (valorBusquedaTelefono.length >= 3)
  );

  // Priorizar el campo que tiene contenido válido (≥3 caracteres)
  // Si ambos tienen contenido, priorizar email
  const valorBusqueda = valorBusquedaEmail.length >= 3
    ? valorBusquedaEmail
    : valorBusquedaTelefono;

  const { cliente: clienteEncontrado, buscando: buscandoCliente } = useClienteAutocompletado(
    valorBusqueda,
    debeActivarBusqueda
  );

  // Autocompletar campos cuando se encuentra un cliente
  useEffect(() => {
    if (clienteEncontrado) {
      // Solo autocompletar nombre y teléfono (NO email, porque ya lo tiene el usuario)
      if (!nombreCliente && clienteEncontrado.nombre) {
        setNombreCliente(clienteEncontrado.nombre);
      }
      if (!apellidosCliente && clienteEncontrado.apellidos) {
        setApellidosCliente(clienteEncontrado.apellidos);
      }
      if (!telefonoCliente && clienteEncontrado.telefono) {
        setTelefonoCliente(clienteEncontrado.telefono);
      }
    }
  }, [clienteEncontrado, nombreCliente, apellidosCliente, telefonoCliente]);

  // Limpiar campos cuando el usuario cambia el email manualmente
  const emailAnteriorRef = useRef(emailCliente);
  useEffect(() => {
    // Si el email cambió y no es por autocompletado
    if (emailAnteriorRef.current !== emailCliente && emailCliente !== '') {
      // Limpiar nombre y teléfono para que se autocompleten con el nuevo cliente
      setNombreCliente('');
      setApellidosCliente('');
      setTelefonoCliente('');
    }
    emailAnteriorRef.current = emailCliente;
  }, [emailCliente]);

  // ── Estados de embalaje y flete (Requisitos 5.3, 6.3) ────────────────────
  const [embalaje, setEmbalaje] = useState({
    activo: false,
    opcion: 'basico',
    precioBasico: 20,
    precioAvanzado: 30,
  });
  const [flete, setFlete] = useState({ activo: false, precio: 20 });

  const pasoInfo = PASOS[pasoActual];
  const esPasoExtras = pasoInfo.id === 'extras';
  const total = calcularPrecioTotal();
  const resumenFinanciero = calcularResumenFinanciero();
  // esAdmin se obtiene del contexto (true si rol='admin')
  // esInvitado se obtiene del contexto (true si no autenticado)

  // ── Resumen financiero admin (Requisitos 7.1–7.11, 4.4) ──────────────────
  // Calculado localmente con useMemo; se recalcula solo cuando cambian sus dependencias.
  const resumenAdmin = useMemo(
    () =>
      calcularResumenFinancieroAdmin({
        configuracionSeleccionada,
        extras,
        embalaje,
        flete,
        margenGanancia,
        tasaIgv,
        tipoCambioUsdPen,
      }),
    [configuracionSeleccionada, extras, embalaje, flete, margenGanancia, tasaIgv, tipoCambioUsdPen]
  );

  // ── Componentes seleccionados para el analizador de presupuesto (Req. 11.5) ─
  const componentesSeleccionados = useMemo(() => {
    const lista = [];
    const agregar = (producto) => {
      if (producto) lista.push({ nombre: producto.nombre, precio_base: producto.precio_base });
    };
    agregar(configuracionSeleccionada.procesador);
    agregar(configuracionSeleccionada.placa_madre);
    agregar(configuracionSeleccionada.almacenamiento);
    agregar(configuracionSeleccionada.gpu);
    agregar(configuracionSeleccionada.fuente);
    agregar(configuracionSeleccionada.case);
    (configuracionSeleccionada.ram || []).forEach(agregar);
    Object.values(extras).forEach((catItems) =>
      catItems.forEach(({ producto }) => agregar(producto))
    );
    return lista;
  }, [configuracionSeleccionada, extras]);
  const handleEmbalajeToggle = (activo) => setEmbalaje((prev) => ({ ...prev, activo }));
  const handleEmbalajeCambiarOpcion = (opcion) => setEmbalaje((prev) => ({ ...prev, opcion }));
  const handleEmbalajeCambiarPrecio = (campo, valor) =>
    setEmbalaje((prev) => ({ ...prev, [campo]: valor }));

  // ── Handlers de flete ─────────────────────────────────────────────────────
  const handleFleteToggle = (activo) => setFlete((prev) => ({ ...prev, activo }));
  const handleFleteCambiarPrecio = (valor) => setFlete((prev) => ({ ...prev, precio: valor }));
  const nombreClienteLimpio = nombreCliente.trim();
  const apellidosClienteLimpio = apellidosCliente.trim();
  const emailClienteLimpio = emailCliente.trim().toLowerCase();
  const telefonoClienteLimpio = telefonoCliente.trim();
  const emailClienteEsValido = emailClienteLimpio ? esEmailValido(emailClienteLimpio) : false;
  const telefonoClienteEsValido = telefonoClienteLimpio ? normalizarTelefono(telefonoClienteLimpio).length >= 7 : false;

  // Validaciones de campos obligatorios (nombre, email, teléfono)
  const faltanDatosClientePublico = !esPrivilegiado && (!nombreClienteLimpio || !emailClienteLimpio || !telefonoClienteLimpio);
  const hayErrorNombreCliente = !esPrivilegiado && intentoGenerar && !nombreClienteLimpio;
  // El correo es obligatorio también para admin: identifica la cuenta/cliente
  // (sea seleccionando una existente o ingresando los datos). Sin correo no se
  // puede generar una cotización "vacía" sin cliente asignado.
  const hayErrorEmailCliente = (intentoGenerar && !emailClienteLimpio)
    || (emailClienteLimpio && !emailClienteEsValido);
  const hayErrorTelefonoCliente = (!esPrivilegiado && intentoGenerar && !telefonoClienteLimpio)
    || (telefonoClienteLimpio && !telefonoClienteEsValido);

  // Privilegiado (admin/vendedor): correo obligatorio (identifica al cliente).
  // Usuario autenticado (cliente): sus datos salen del token, no usa formulario.
  // Invitado: nombre, correo y teléfono.
  const datosClienteValidos = esPrivilegiado
    ? emailClienteEsValido && (!telefonoClienteLimpio || telefonoClienteEsValido)
    : autenticado
      ? true  // usuario registrado — el backend usa su id del token
      : Boolean(nombreClienteLimpio && emailClienteEsValido && telefonoClienteEsValido);
  const procesadorTieneGraficosIntegrados = useMemo(() => {
    const procesador = configuracionSeleccionada.procesador;
    if (!procesador) return false;

    const camposBooleanos = [
      procesador.graficos_integrados,
      procesador.tiene_graficos_integrados,
      procesador.integrated_graphics,
      procesador.igpu,
      procesador.con_graficos,
    ];

    if (camposBooleanos.some((valor) => valorBooleano(valor))) return true;

    const texto = normalizarTexto(`${procesador.nombre || ''} ${procesador.descripcion_tecnica || ''}`);
    if (!texto.trim()) return false;

    const patronNegativo = /(sin\s+graficos?\s+integrados?|without integrated graphics|no\s+i?gpu)/;
    if (patronNegativo.test(texto)) return false;

    const patronIntegrados = /(graficos?\s+integrados?|integrated graphics|i?gpu|intel\s+uhd|intel\s+iris|radeon\s+graphics)/;
    return patronIntegrados.test(texto);
  }, [configuracionSeleccionada.procesador]);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const haySeleccion = Object.values(configuracionSeleccionada).some((valor) => {
      if (Array.isArray(valor)) return valor.length > 0;
      return valor !== null;
    });
    if (haySeleccion) validarCompatibilidad();
  }, [configuracionSeleccionada]);

  const pasoCompleto = (indicePaso) => {
    const paso = PASOS[indicePaso];
    if (paso.id === 'extras') return true; // Extras siempre opcional
    const valor = configuracionSeleccionada[paso.id];
    if (paso.id === 'ram') return Array.isArray(valor) && valor.length > 0;
    if (paso.id === 'gpu' && procesadorTieneGraficosIntegrados) return true;
    return Boolean(valor);
  };

  const pasoHabilitado = (indicePaso) => {
    if (indicePaso === 0) return true;
    return pasoCompleto(indicePaso - 1);
  };

  const pasosCompletos = PASOS_COMPONENTES.filter((_, i) => pasoCompleto(i)).length;
  const configuracionCompleta = pasosCompletos === PASOS_COMPONENTES.length;

  const primerPasoPendiente = useMemo(
    () => PASOS.findIndex((_, indice) => !pasoCompleto(indice)),
    [configuracionSeleccionada]
  );

  const ramAgrupada = useMemo(
    () => agruparRam(configuracionSeleccionada.ram || []),
    [configuracionSeleccionada.ram]
  );

  // ── Productos para BalanceFinal (Req. 3.2) ───────────────────────────────
  // Array plano de { precio_base, cantidad } para todos los componentes principales.
  // Los extras se pasan directamente como el objeto `extras` del contexto.
  const productosParaBalance = useMemo(() => {
    const lista = [];
    const agregar = (producto, cantidad = 1) => {
      if (producto?.precio_base != null) {
        lista.push({ precio_base: producto.precio_base, cantidad });
      }
    };
    agregar(configuracionSeleccionada.procesador);
    agregar(configuracionSeleccionada.placa_madre);
    agregar(configuracionSeleccionada.almacenamiento);
    agregar(configuracionSeleccionada.gpu);
    agregar(configuracionSeleccionada.fuente);
    agregar(configuracionSeleccionada.case);
    Object.values(ramAgrupada).forEach((item) => agregar(item.producto, item.cantidad));
    return lista;
  }, [configuracionSeleccionada, ramAgrupada]);

  // Función para verificar si un producto es compatible con la configuración actual
  const esProductoCompatible = useCallback((producto) => {
    if (pasoInfo.id === 'placa_madre' && configuracionSeleccionada.procesador?.socket) {
      const socket = configuracionSeleccionada.procesador.socket;
      if (producto.socket && producto.socket !== socket) {
        return { compatible: false, razon: `Requiere socket ${socket}` };
      }
    }

    if (pasoInfo.id === 'ram' && configuracionSeleccionada.placa_madre?.ram_type) {
      const ramType = configuracionSeleccionada.placa_madre.ram_type;
      if (producto.ram_type && producto.ram_type !== ramType) {
        return { compatible: false, razon: `Requiere ${ramType}` };
      }
    }

    if (pasoInfo.id === 'almacenamiento' && configuracionSeleccionada.placa_madre) {
      if (!placaSoportaAlmacenamiento(configuracionSeleccionada.placa_madre, producto)) {
        return { compatible: false, razon: 'Placa no soporta este almacenamiento' };
      }
    }

    if (pasoInfo.id === 'case' && configuracionSeleccionada.placa_madre?.form_factor) {
      const ffPlaca = normalizarFormFactor(configuracionSeleccionada.placa_madre.form_factor);
      if (ffPlaca) {
        const soportados = parsearFormFactors(producto.descripcion_tecnica);
        if (!soportados.includes(ffPlaca)) {
          return { compatible: false, razon: `No soporta ${ffPlaca}` };
        }
      }
    }

    return { compatible: true, razon: null };
  }, [pasoInfo.id, configuracionSeleccionada]);

  const productosPasoBase = useMemo(() => {
    let lista = productos.filter((p) => p.categoria === pasoInfo.categoria);

    // Aplicar filtros de compatibilidad solo si soloCompatibles está activo
    if (soloCompatibles) {
      if (pasoInfo.id === 'placa_madre' && configuracionSeleccionada.procesador?.socket) {
        const socket = configuracionSeleccionada.procesador.socket;
        const compatibles = lista.filter((p) => !p.socket || p.socket === socket);
        if (compatibles.length > 0) lista = compatibles;
      }

      if (pasoInfo.id === 'ram' && configuracionSeleccionada.placa_madre?.ram_type) {
        const ramType = configuracionSeleccionada.placa_madre.ram_type;
        const compatibles = lista.filter((p) => !p.ram_type || p.ram_type === ramType);
        if (compatibles.length > 0) lista = compatibles;
      }

      if (pasoInfo.id === 'almacenamiento' && configuracionSeleccionada.placa_madre) {
        const compatibles = lista.filter((p) => placaSoportaAlmacenamiento(configuracionSeleccionada.placa_madre, p));
        if (compatibles.length > 0) lista = compatibles;
      }

      if (pasoInfo.id === 'case' && configuracionSeleccionada.placa_madre?.form_factor) {
        const ffPlaca = normalizarFormFactor(configuracionSeleccionada.placa_madre.form_factor);
        if (ffPlaca) {
          const compatibles = lista.filter((p) => {
            const soportados = parsearFormFactors(p.descripcion_tecnica);
            return soportados.includes(ffPlaca);
          });
          if (compatibles.length > 0) lista = compatibles;
        }
      }
    }

    // Filtro de stock (siempre aplicar)
    lista = lista.filter((p) => p.stock > 0 || p.disponible_a_pedido === true);

    return lista;
  }, [productos, pasoInfo, configuracionSeleccionada, soloCompatibles]);

  const opcionesFiltrosPaso = useMemo(() => {
    switch (pasoInfo.id) {
      case 'procesador':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          modelos: extraerValoresUnicos(productosPasoBase.map(extraerModeloProcesador)),
        };
      case 'placa_madre':
        return { marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)) };
      case 'ram':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          frecuencias: extraerValoresUnicos(productosPasoBase.map(extraerFrecuenciaRam)),
          capacidades: extraerValoresUnicos(
            productosPasoBase.map(extraerCapacidadRam)
          ).sort((a, b) => {
            const numA = parseInt(a, 10) || 0;
            const numB = parseInt(b, 10) || 0;
            return numA - numB;
          }),
        };
      case 'almacenamiento':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          capacidades: extraerValoresUnicos(productosPasoBase.map(extraerCapacidadAlmacenamiento)),
          tipos: extraerValoresUnicos(productosPasoBase.map(extraerTipoAlmacenamiento)),
        };
      case 'gpu':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          series: extraerValoresUnicos(productosPasoBase.map(extraerSerieGPU)),
        };
      case 'fuente':
        return {
          marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)),
          potencias: extraerValoresUnicos(productosPasoBase.map(extraerPotenciaFuente)),
        };
      case 'case':
        return { marcas: extraerValoresUnicos(productosPasoBase.map(extraerMarca)) };
      default:
        return {};
    }
  }, [productosPasoBase, pasoInfo.id]);

  const productosFiltrados = useMemo(() => {
    let lista = [...productosPasoBase];
    const coincide = (valor, filtroActivo) => normalizarTexto(valor) === normalizarTexto(filtroActivo);

    // Filtro global por etiqueta de perfil (Básico/Medio/Avanzado/Gamer Full).
    if (filtroEtiqueta !== 'all') {
      lista = lista.filter((p) => String(p.etiqueta || '') === filtroEtiqueta);
    }

    switch (pasoInfo.id) {
      case 'procesador':
        if (filtrosPaso.procesadorMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.procesadorMarca));
        }
        if (filtrosPaso.procesadorModelo !== 'all') {
          lista = lista.filter((p) => coincide(extraerModeloProcesador(p), filtrosPaso.procesadorModelo));
        }
        break;
      case 'placa_madre':
        if (filtrosPaso.placaMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.placaMarca));
        }
        break;
      case 'ram':
        if (filtrosPaso.ramMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.ramMarca));
        }
        if (filtrosPaso.ramFrecuencia !== 'all') {
          lista = lista.filter((p) => coincide(extraerFrecuenciaRam(p), filtrosPaso.ramFrecuencia));
        }
        if (filtrosPaso.ramCapacidad !== 'all') {
          lista = lista.filter((p) => coincide(extraerCapacidadRam(p), filtrosPaso.ramCapacidad));
        }
        break;
      case 'almacenamiento':
        if (filtrosPaso.almacenamientoMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.almacenamientoMarca));
        }
        if (filtrosPaso.almacenamientoCapacidad !== 'all') {
          lista = lista.filter((p) => coincide(extraerCapacidadAlmacenamiento(p), filtrosPaso.almacenamientoCapacidad));
        }
        if (filtrosPaso.almacenamientoTipo !== 'all') {
          lista = lista.filter((p) => coincide(extraerTipoAlmacenamiento(p), filtrosPaso.almacenamientoTipo));
        }
        break;
      case 'gpu':
        if (filtrosPaso.gpuMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.gpuMarca));
        }
        if (filtrosPaso.gpuSerie !== 'all') {
          lista = lista.filter((p) => coincide(extraerSerieGPU(p), filtrosPaso.gpuSerie));
        }
        break;
      case 'fuente':
        if (filtrosPaso.fuenteMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.fuenteMarca));
        }
        if (filtrosPaso.fuentePotencia !== 'all') {
          lista = lista.filter((p) => coincide(extraerPotenciaFuente(p), filtrosPaso.fuentePotencia));
        }
        break;
      case 'case':
        if (filtrosPaso.caseMarca !== 'all') {
          lista = lista.filter((p) => coincide(extraerMarca(p), filtrosPaso.caseMarca));
        }
        break;
      default:
        break;
    }

    return lista;
  }, [productosPasoBase, pasoInfo.id, filtrosPaso, filtroEtiqueta]);

  // Aplicar ordenamiento por precio después de todos los filtros (Req. 10.3–10.6)
  const productosFiltradosYOrdenados = useMemo(
    () => ordenarProductos(productosFiltrados, ordenPrecio),
    [productosFiltrados, ordenPrecio]
  );

  const gruposProductos = useMemo(() => {
    if (pasoInfo.id === 'procesador') {
      const grupos = productosFiltradosYOrdenados.reduce((acc, producto) => {
        const modelo = extraerModeloProcesador(producto);
        if (!acc[modelo]) acc[modelo] = [];
        acc[modelo].push(producto);
        return acc;
      }, {});
      return Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .map(([titulo, items]) => ({ titulo, items }));
    }

    if (pasoInfo.id === 'placa_madre') {
      const grupos = productosFiltradosYOrdenados.reduce((acc, producto) => {
        const socket = producto.socket ? `Socket ${producto.socket}` : 'Otros sockets';
        if (!acc[socket]) acc[socket] = [];
        acc[socket].push(producto);
        return acc;
      }, {});
      return Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .map(([titulo, items]) => ({ titulo, items }));
    }

    if (pasoInfo.id === 'ram') {
      const grupos = productosFiltradosYOrdenados.reduce((acc, producto) => {
        const tipo = producto.ram_type || 'Otros';
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(producto);
        return acc;
      }, {});
      return Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
        .map(([titulo, items]) => ({ titulo, items }));
    }

    if (pasoInfo.id === 'almacenamiento') {
      const orden = ['M.2 / NVMe', 'SSD', 'HDD', 'Otros'];
      const grupos = productosFiltradosYOrdenados.reduce((acc, producto) => {
        const tipo = extraerTipoAlmacenamiento(producto);
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(producto);
        return acc;
      }, {});
      return orden
        .filter((titulo) => Array.isArray(grupos[titulo]) && grupos[titulo].length > 0)
        .map((titulo) => ({ titulo, items: grupos[titulo] }));
    }
    
    if (pasoInfo.id === 'fuente') {
      const grupos = productosFiltradosYOrdenados.reduce((acc, producto) => {
        const t = normalizarTexto(producto.descripcion_tecnica);
        let cert = 'Otras';
        if (t.includes('80 plus titanium') || t.includes('80+ titanium')) cert = '80+ Titanium';
        else if (t.includes('80 plus platinum') || t.includes('80+ platinum')) cert = '80+ Platinum';
        else if (t.includes('80 plus gold') || t.includes('80+ gold')) cert = '80+ Gold';
        else if (t.includes('80 plus bronze') || t.includes('80+ bronze')) cert = '80+ Bronze';
        else if (t.includes('80 plus white') || t.includes('80+ white') || t.includes('80 plus standard')) cert = '80+ White / Standard';
        
        if (!acc[cert]) acc[cert] = [];
        acc[cert].push(producto);
        return acc;
      }, {});
      const certOrden = ['80+ Titanium', '80+ Platinum', '80+ Gold', '80+ Bronze', '80+ White / Standard', 'Otras'];
      return certOrden
        .filter((titulo) => Array.isArray(grupos[titulo]) && grupos[titulo].length > 0)
        .map((titulo) => ({ titulo, items: grupos[titulo] }));
    }

    return [{ titulo: null, items: productosFiltradosYOrdenados }];
  }, [productosFiltradosYOrdenados, pasoInfo.id]);

  const seleccionActual = configuracionSeleccionada[pasoInfo.id];
  const actualizarFiltroPaso = (clave, valor) => {
    setFiltrosPaso((prev) => ({ ...prev, [clave]: valor }));
  };

  const irAPaso = (indicePaso) => {
    if (!pasoHabilitado(indicePaso)) {
      toast.info('Paso bloqueado', 'Completa los pasos anteriores para avanzar.');
      return;
    }
    setPasoActual(indicePaso);
  };

  const irSiguiente = () => {
    if (!pasoCompleto(pasoActual)) {
      toast.warning('Falta seleccion', 'Selecciona un componente para continuar.');
      return;
    }
    if (pasoActual < PASOS.length - 1) setPasoActual((prev) => prev + 1);
  };

  const irAnterior = () => {
    if (pasoActual > 0) setPasoActual((prev) => prev - 1);
  };

  const seleccionarProducto = (producto) => {
    if (pasoInfo.id === 'ram') {
      agregarRAM(producto);
      return;
    }
    
    // Si ya es el componente seleccionado, se deselecciona.
    if (seleccionActual?.id === producto.id) {
      seleccionarComponente(pasoInfo.id, null);
    } else {
      seleccionarComponente(pasoInfo.id, producto);
    }
  };

  const resolverProducto = (entrada) => {
    if (!entrada) return null;
    const id = entrada.id ?? entrada.id_producto;
    if (id) {
      const encontradoPorId = productos.find((p) => Number(p.id) === Number(id));
      if (encontradoPorId) return encontradoPorId;
    }

    const nombre = String(entrada.nombre || '').toLowerCase().trim();
    if (!nombre) return null;
    return productos.find((p) => String(p.nombre || '').toLowerCase().trim() === nombre) || null;
  };

  const aplicarRecomendacionIA = (componentesRecomendados = {}) => {
    let cambios = 0;

    Object.entries(componentesRecomendados).forEach(([categoria, valor]) => {
      if (Array.isArray(valor) && categoria === 'ram') {
        valor.forEach((item) => {
          const producto = resolverProducto(item);
          if (producto) {
            agregarRAM(producto);
            cambios += 1;
          }
        });
        return;
      }

      const producto = resolverProducto(valor);
      if (producto && PASOS.some((paso) => paso.id === categoria)) {
        seleccionarComponente(categoria, producto);
        cambios += 1;
      }
    });

    if (cambios > 0) {
      toast.success('Recomendacion aplicada', `Se aplicaron ${cambios} componente(s) sugeridos.`);
    } else {
      toast.warning('Sin coincidencias', 'No se encontraron productos del catalogo para aplicar la recomendacion.');
    }
  };

  const quitarRam = (idProducto) => {
    let ultimoIndice = -1;
    (configuracionSeleccionada.ram || []).forEach((ram, index) => {
      if (ram.id === idProducto) ultimoIndice = index;
    });
    if (ultimoIndice >= 0) eliminarRAM(ultimoIndice);
  };

  // Anula por completo un modulo de RAM (todas sus unidades), equivalente a
  // deseleccionar el componente en los otros pasos.
  const anularRam = (idProducto) => {
    setConfiguracionSeleccionada((prev) => ({
      ...prev,
      ram: (prev.ram || []).filter((ram) => ram.id !== idProducto),
    }));
  };

  const construirPayloadCotizacion = () => {
    const componentes = [];
    const pushComponente = (producto, cantidad = 1, categoria = null) => {
      if (!producto) return;
      const cat = categoria || producto.categoria;
      componentes.push({
        id_producto: producto.id,
        cantidad,
        tabla_producto: `productos_${cat}`,
      });
    };

    pushComponente(configuracionSeleccionada.procesador);
    pushComponente(configuracionSeleccionada.placa_madre);
    pushComponente(configuracionSeleccionada.almacenamiento);
    pushComponente(configuracionSeleccionada.gpu);
    pushComponente(configuracionSeleccionada.fuente);
    pushComponente(configuracionSeleccionada.case);

    Object.values(ramAgrupada).forEach((item) => pushComponente(item.producto, item.cantidad));

    // Agregar extras
    Object.entries(extras).forEach(([categoria, items]) => {
      items.forEach(({ producto, cantidad }) => {
        pushComponente(producto, cantidad, categoria);
      });
    });

    const payload = { componentes };
    payload.margen_personalizado = Number(margenGanancia);
    payload.cantidad_equipos = Math.max(1, parseInt(cantidadEquipos, 10) || 1);
    if (nombreClienteLimpio) payload.nombre_cliente = nombreClienteLimpio;
    if (apellidosClienteLimpio) payload.apellidos_cliente = apellidosClienteLimpio;
    if (emailClienteLimpio) payload.email_cliente = emailClienteLimpio;
    if (telefonoClienteLimpio) payload.telefono_cliente = telefonoClienteLimpio;
    return payload;
  };

  const generarCotizacion = async () => {
    setIntentoGenerar(true);

    if (!configuracionCompleta) {
      if (primerPasoPendiente >= 0) setPasoActual(primerPasoPendiente);
      toast.warning('Configuracion incompleta', 'Completa todos los pasos antes de generar.');
      return;
    }

    if (validacionCompatibilidad.errores.length > 0) {
      toast.error('Incompatibilidades detectadas', 'Corrige los errores antes de continuar.');
      return;
    }

    if (!datosClienteValidos) {
      if (!esPrivilegiado && faltanDatosClientePublico) {
        toast.warning('Datos incompletos', 'Ingresa nombre y correo para generar la cotizacion.');
      } else if (hayErrorEmailCliente) {
        toast.warning('Correo invalido', 'Corrige el correo del cliente para continuar.');
      } else if (hayErrorTelefonoCliente) {
        toast.warning('Telefono invalido', 'Ingresa un telefono valido o deja el campo vacio.');
      }
      return;
    }

    setGenerando(true);
    setErrorGenerar('');

    try {
      const respuesta = await api.crearCotizacion(construirPayloadCotizacion());
      setCotizacionGenerada(respuesta?.cotizacion || null);
      limpiarPersistencia();
      toast.success('Cotizacion generada', 'Ya puedes copiar el ticket o descargar el PDF.');
    } catch (error) {
      const mensaje = error?.mensaje || 'No se pudo generar la cotizacion.';
      setErrorGenerar(mensaje);
      toast.error('No se pudo generar', mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const descargarPdf = async () => {
    if (!cotizacionGenerada?.codigo_ticket) return;
    try {
      // Descarga autenticada (el endpoint de PDF requiere sesión)
      const blob = await api.descargarPdfCotizacion(cotizacionGenerada.codigo_ticket, monedaVista);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `cotizacion-${cotizacionGenerada.codigo_ticket}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      toast.info('PDF descargado', 'Se descargo el archivo de la cotizacion.');
    } catch (error) {
      toast.error('No se pudo descargar', error?.mensaje || 'Intenta nuevamente.');
    }
  };

  const copiarTicket = async () => {
    if (!cotizacionGenerada?.codigo_ticket || !navigator.clipboard) {
      toast.error('No se pudo copiar', 'Tu navegador no permite copiar automaticamente.');
      return;
    }

    try {
      await navigator.clipboard.writeText(cotizacionGenerada.codigo_ticket);
      toast.success('Codigo copiado', 'El ticket esta en tu portapapeles.');
    } catch {
      toast.error('No se pudo copiar', 'Copia el codigo manualmente.');
    }
  };

  // ── Confirmar cotización por WhatsApp ───────────────────────────────────────
  // Registra la solicitud en el sistema y abre WhatsApp con un mensaje
  // prearmado (ticket + total). La verificación final la hace ventas.
  const confirmarPorWhatsApp = async () => {
    if (!cotizacionGenerada?.codigo_ticket) return;

    const enlace = construirEnlaceWhatsApp({
      numero: numeroWhatsAppVentas,
      mensaje: construirMensajeConfirmacion({
        codigoTicket: cotizacionGenerada.codigo_ticket,
        montoFormateado: formatearMontoSegunMonedaVista({
          montoUsd: cotizacionGenerada?.finanzas?.total?.usd ?? cotizacionGenerada.precio_total,
          montoPen: cotizacionGenerada?.finanzas?.total?.pen,
        }),
      }),
    });

    if (!enlace) {
      toast.error('WhatsApp no disponible', 'No hay un número de ventas configurado. Avisa al administrador.');
      return;
    }

    // Registrar la solicitud (no bloquea la apertura de WhatsApp si falla).
    try {
      await api.solicitarConfirmacionCotizacion(cotizacionGenerada.codigo_ticket);
    } catch {
      // Silencioso: la marca es un complemento; el cliente igual contacta a ventas.
    }

    window.open(enlace, '_blank', 'noopener,noreferrer');
  };

  // ── Compartir configuración (Req. 10.1, 10.2, 10.3, 10.9) ───────────────────
  const compartirConfiguracion = async () => {
    const haySeleccion = Object.values(configuracionSeleccionada).some((valor) => {
      if (Array.isArray(valor)) return valor.length > 0;
      return valor !== null;
    });

    if (!haySeleccion) return;

    try {
      const url = api.generarUrlConfiguracion(configuracionSeleccionada);
      const urlAbsoluta = `${window.location.origin}${url}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(urlAbsoluta);
        toast.success('Enlace copiado', 'El link de configuración está en tu portapapeles.');
      } else {
        toast.warning('No se pudo copiar', 'Copia el enlace manualmente: ' + urlAbsoluta);
      }
    } catch {
      toast.error('Error al compartir', 'No se pudo generar el enlace de configuración.');
    }
  };

  const nuevaCotizacion = () => {
    limpiarConfiguracion();
    limpiarExtras();
    limpiarPersistencia();
    setPasoActual(0);
    setCotizacionGenerada(null);
    setErrorGenerar('');
    setIntentoGenerar(false);
    setNombreCliente('');
    setApellidosCliente('');
    setEmailCliente('');
    setTelefonoCliente('');
    setEmbalaje({ activo: false, opcion: 'basico', precioBasico: 20, precioAvanzado: 30 });
    setFlete({ activo: false, precio: 20 });
    toast.info('Nuevo flujo', 'Empezaste una cotizacion nueva.');
  };

  const renderCampoFiltro = (id, label, value, onChange, options = [], allLabel = 'Todas') => (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

  const renderFiltrosPaso = () => {
    switch (pasoInfo.id) {
      case 'procesador':
        return (
          <>
            {renderCampoFiltro(
              'filtro-procesador-marca',
              'Marca',
              filtrosPaso.procesadorMarca,
              (valor) => actualizarFiltroPaso('procesadorMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-procesador-modelo',
              'Modelo',
              filtrosPaso.procesadorModelo,
              (valor) => actualizarFiltroPaso('procesadorModelo', valor),
              opcionesFiltrosPaso.modelos || [],
              'Todos'
            )}
          </>
        );
      case 'placa_madre':
        return (
          <>
            {renderCampoFiltro(
              'filtro-placa-marca',
              'Marca',
              filtrosPaso.placaMarca,
              (valor) => actualizarFiltroPaso('placaMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
          </>
        );
      case 'ram':
        return (
          <>
            {renderCampoFiltro(
              'filtro-ram-marca',
              'Marca',
              filtrosPaso.ramMarca,
              (valor) => actualizarFiltroPaso('ramMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-ram-capacidad',
              'Capacidad (GB)',
              filtrosPaso.ramCapacidad,
              (valor) => actualizarFiltroPaso('ramCapacidad', valor),
              opcionesFiltrosPaso.capacidades || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-ram-frecuencia',
              'Frecuencia (MHz)',
              filtrosPaso.ramFrecuencia,
              (valor) => actualizarFiltroPaso('ramFrecuencia', valor),
              opcionesFiltrosPaso.frecuencias || [],
              'Todas'
            )}
          </>
        );
      case 'almacenamiento':
        return (
          <>
            {renderCampoFiltro(
              'filtro-almacenamiento-marca',
              'Marca',
              filtrosPaso.almacenamientoMarca,
              (valor) => actualizarFiltroPaso('almacenamientoMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-almacenamiento-capacidad',
              'Almacenamiento',
              filtrosPaso.almacenamientoCapacidad,
              (valor) => actualizarFiltroPaso('almacenamientoCapacidad', valor),
              opcionesFiltrosPaso.capacidades || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-almacenamiento-tipo',
              'Tipo',
              filtrosPaso.almacenamientoTipo,
              (valor) => actualizarFiltroPaso('almacenamientoTipo', valor),
              opcionesFiltrosPaso.tipos || [],
              'Todos'
            )}
          </>
        );
      case 'gpu':
        return (
          <>
            {renderCampoFiltro(
              'filtro-gpu-marca',
              'Marca',
              filtrosPaso.gpuMarca,
              (valor) => actualizarFiltroPaso('gpuMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-gpu-serie',
              'Serie',
              filtrosPaso.gpuSerie,
              (valor) => actualizarFiltroPaso('gpuSerie', valor),
              opcionesFiltrosPaso.series || [],
              'Todas'
            )}
          </>
        );
      case 'fuente':
        return (
          <>
            {renderCampoFiltro(
              'filtro-fuente-marca',
              'Marca',
              filtrosPaso.fuenteMarca,
              (valor) => actualizarFiltroPaso('fuenteMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
            {renderCampoFiltro(
              'filtro-fuente-potencia',
              'Potencia (W)',
              filtrosPaso.fuentePotencia,
              (valor) => actualizarFiltroPaso('fuentePotencia', valor),
              opcionesFiltrosPaso.potencias || [],
              'Todas'
            )}
          </>
        );
      case 'case':
        return (
          <>
            {renderCampoFiltro(
              'filtro-case-marca',
              'Marca',
              filtrosPaso.caseMarca,
              (valor) => actualizarFiltroPaso('caseMarca', valor),
              opcionesFiltrosPaso.marcas || [],
              'Todas'
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

      {/* Banner de invitado */}
      {esInvitado && (
        <section className="surface-card rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-[color:rgba(255,214,10,0.08)] p-4 space-y-3" aria-label="Registro requerido">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 mt-0.5 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">Inicia sesión para acceder a todas las funciones</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Para ver precios, crear cotizaciones y usar el asistente IA, necesitas una cuenta.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pl-8">
            <Link to="/registro">
              <Button size="sm">Crear cuenta</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="sm">Iniciar sesión</Button>
            </Link>
          </div>
        </section>
      )}

      <header className="hidden surface-elevated p-6">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Cotizador de PC</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Configura tu computadora paso a paso con validacion y total en tiempo real.</p>
      </header>

      <section className="surface-card space-y-3 p-4" aria-label="Pasos del cotizador" data-tour="cotizador-pasos">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-8">
          {PASOS.map((paso, indice) => {
            const activo = indice === pasoActual;
            const completo = pasoCompleto(indice);
            const habilitado = pasoHabilitado(indice);
            return (
              <li key={paso.id}>
                <button
                  type="button"
                  onClick={() => irAPaso(indice)}
                  disabled={!habilitado}
                  aria-current={activo ? 'step' : undefined}
                  aria-disabled={!habilitado}
                  className={`w-full min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm font-medium transition-colors duration-higNormal ease-hig ${activo
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                    : completo
                      ? 'border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]'
                    } ${!habilitado ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {completo ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      <StepIcon pasoId={paso.id} className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{paso.nombre}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface-elevated space-y-5 p-5 sm:p-6 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto scrollbar-thin" data-tour="cotizador-productos">          {/* Header del paso */}
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Paso {pasoActual + 1} de {PASOS.length}</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{pasoInfo.nombre}</h2>
          </div>

          {/* Toolbar unificada de controles de visualización (Apple HIG) */}
          {!esPasoExtras && (
            <div
              className="flex flex-wrap items-center justify-between gap-4 mt-4 px-4 py-3 bg-[var(--color-surface-soft)] rounded-[12px] border border-[var(--color-border)]"
              role="toolbar"
              aria-label="Controles de visualización de productos"
            >
              {/* Grupo izquierdo: Vista */}
              <SelectorVistaProductos
                vistaDetallada={vistaDetalladaProductos}
                onChange={setVistaDetalladaProductos}
              />

              {/* Grupo derecho: Compatibilidad + Orden */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Switch_Compatibilidad — Compatibles/Todos (Req. 2.4, 2.5, 2.6) */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={soloCompatibles}
                  aria-label="Filtrar por compatibilidad"
                  onClick={() => setSoloCompatibles((prev) => !prev)}
                  className={[
                    'inline-flex min-h-[44px] w-[148px] shrink-0 items-center gap-2 rounded-[var(--radius-md)]',
                    'border px-4 text-sm font-medium',
                    'transition-colors duration-higNormal ease-hig',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
                    'active:scale-[0.97]',
                    soloCompatibles
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full',
                      'transition-colors duration-higNormal',
                      soloCompatibles ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm',
                        'transition-transform duration-higNormal',
                        soloCompatibles ? 'translate-x-4' : 'translate-x-1',
                      ].join(' ')}
                    />
                  </span>
                  <span className="flex-1 text-left">
                    {soloCompatibles ? 'Compatibles' : 'Todos'}
                  </span>
                </button>

                {/* Ordenamiento por precio */}
                <div
                  role="group"
                  aria-label="Ordenar por precio"
                  className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5 gap-0.5"
                >
                  {[
                    { value: 'relevancia', label: 'Relevancia' },
                    { value: 'menor', label: 'Menor precio' },
                    { value: 'mayor', label: 'Mayor precio' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrdenPrecio(value)}
                      aria-pressed={ordenPrecio === value}
                      className={[
                        'min-h-[44px] min-w-[44px] px-3 py-2 rounded-[calc(var(--radius-sm)-2px)] text-sm font-medium',
                        'transition-colors duration-higNormal ease-hig',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
                        ordenPrecio === value
                          ? 'bg-[var(--color-accent)] text-white shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación — parte superior del área de contenido del Paso_Actual (Req. 2.7, 2.8, 2.9, 2.10) */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={irAnterior}
              disabled={pasoActual === 0}
              aria-label="Paso anterior"
              className={[
                'inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-[var(--radius-sm)]',
                'border border-[var(--color-border)] px-4 text-sm font-medium',
                'text-[var(--color-text-muted)]',
                'transition-colors duration-higNormal ease-hig',
                'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
                'active:bg-[var(--color-surface-soft)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
              ].join(' ')}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Anterior
            </button>
            <div className="flex flex-1 items-center">
              {pasoInfo.id === 'ram' ? (
                Object.values(ramAgrupada).length > 0 ? (
                  <div className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Seleccion actual</p>
                    <div className="mt-0.5 flex flex-col gap-1">
                      {Object.values(ramAgrupada).map(({ producto, cantidad }) => (
                        <div key={producto.id} className="flex w-full items-center justify-between gap-3">
                          <span className="inline-flex min-w-0 items-baseline gap-1.5">
                            <span className="truncate text-sm font-semibold text-[var(--color-text)]">{producto.nombre}</span>
                            <span className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">×{cantidad}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => anularRam(producto.id)}
                            aria-label={`Quitar ${producto.nombre}`}
                            title="Quitar seleccion"
                            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="w-full text-center text-sm text-[var(--color-text-muted)]">Selecciona una opcion.</p>
                )
              ) : seleccionActual ? (
                <div className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Seleccion actual</p>
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{seleccionActual.nombre}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => seleccionarComponente(pasoInfo.id, null)}
                    aria-label="Quitar seleccion actual"
                    title="Quitar seleccion"
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="w-full text-center text-sm text-[var(--color-text-muted)]">
                  {pasoInfo.id === 'gpu' && procesadorTieneGraficosIntegrados && !configuracionSeleccionada.gpu
                    ? 'Paso opcional'
                    : 'Selecciona una opcion.'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={irSiguiente}
              disabled={pasoActual === PASOS.length - 1}
              aria-label="Paso siguiente"
              className={[
                'inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-[var(--radius-sm)]',
                'bg-[var(--color-accent)] px-4 text-sm font-semibold text-white',
                'transition-colors duration-higNormal ease-hig',
                'hover:bg-[color:rgba(0,122,255,0.85)]',
                'active:bg-[color:rgba(0,122,255,0.75)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-accent)]',
              ].join(' ')}
            >
              Siguiente
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {pasoInfo.id === 'gpu' && procesadorTieneGraficosIntegrados ? (
            <div className="rounded-[var(--radius-md)] border border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)] p-3 text-sm text-[var(--color-success)]">
              El procesador <span className="font-semibold">{configuracionSeleccionada.procesador?.nombre}</span> elegido cuenta con video integrado. Es opcional escoger una Tarjeta de Grafica.
            </div>
          ) : null}

          {esPasoExtras ? (
            /* ======== PASO EXTRAS — Acordeones por subsección ======== */
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-muted)]">
                Agrega accesorios y perifericos opcionales. Puedes omitir esta seccion.
              </p>
              {SUBSECCIONES_EXTRAS.map((subseccion) => (
                  <ExtrasAccordion
                    key={subseccion.titulo}
                    subseccion={subseccion}
                    extras={extras}
                    cargarExtras={cargarExtras}
                    cargandoExtras={cargandoExtras}
                    agregarExtra={agregarExtra}
                    quitarExtra={quitarExtra}
                    formatearMontoSegunMonedaVista={formatearMontoSegunMonedaVista}
                    esInvitado={esInvitado}
                  />
              ))}
            </div>
          ) : (
            /* ======== PASOS DE COMPONENTES — Grid original ======== */
            <>
              <section className="surface-card p-3" aria-label="Filtros de productos">
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
                  {renderFiltrosPaso()}
                  {etiquetasDisponibles.length > 0
                    ? renderCampoFiltro(
                        'filtro-etiqueta-perfil',
                        'Etiqueta de perfil',
                        filtroEtiqueta,
                        (valor) => setFiltroEtiqueta(valor),
                        etiquetasDisponibles.map((et) => et.nombre),
                        'Todas las etiquetas'
                      )
                    : null}
                </div>
              </section>

              {cargandoProductos ? (
                <div className="surface-card py-16">
                  <LoadingSpinner label="Cargando productos..." />
                </div>
              ) : errorProductos ? (
                <ErrorState title="No se cargaron productos" description={errorProductos} onRetry={cargarProductos} />
              ) : productosFiltradosYOrdenados.length === 0 ? (
                <EmptyState
                  title="Sin productos para este paso"
                  description="Prueba con el filtro Todos o revisa el stock disponible."
                  actionLabel="Ver todos"
                  onAction={() => setSoloDisponibles(false)}
                />
              ) : (
                <div className="space-y-5">
                  {gruposProductos.map((grupo) => (
                    <div key={grupo.titulo || 'grupo-unico'} className="space-y-3">
                      {grupo.titulo ? (
                        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{grupo.titulo}</h3>
                      ) : null}
                      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {grupo.items.map((producto) => {
                          const esRam = pasoInfo.id === 'ram';
                          const seleccionado = esRam ? Boolean(ramAgrupada[producto.id]) : seleccionActual?.id === producto.id;
                          const estadoStock = obtenerEstadoStock(producto);
                          const cantidadRam = ramAgrupada[producto.id]?.cantidad || 0;
                          const maxRam = producto.stock > 0 ? producto.stock : 8;
                          const specsDetalladas = obtenerSpecsDetalladasProducto(producto, pasoInfo.id);
                          const yaEnComparador = productosComparar.some((p) => p.id === producto.id);

                          // Verificar compatibilidad cuando soloCompatibles está desactivado
                          const infoCompatibilidad = !soloCompatibles ? esProductoCompatible(producto) : { compatible: true, razon: null };
                          const esIncompatible = !infoCompatibilidad.compatible;

                          return (
                            <motion.article
                              key={producto.id}
                              layout
                              className={`surface-card flex h-full flex-col p-4 ${seleccionado ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg)]' : ''} ${esIncompatible ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                                    {capitalizarPrimeraLetra(producto.nombre)}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                                    {producto.etiqueta ? (
                                      <span className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 font-semibold text-[var(--color-accent-text)]">
                                        {producto.etiqueta}
                                      </span>
                                    ) : null}
                                    {vistaDetalladaProductos ? (
                                      <>
                                        <span className="inline-flex rounded-full bg-[var(--color-surface-soft)] px-2.5 py-1 font-medium">
                                          {capitalizarPrimeraLetra(extraerMarca(producto))}
                                        </span>
                                        <span className="inline-flex rounded-full bg-[var(--color-surface-soft)] px-2.5 py-1 font-medium">
                                          {pasoInfo.nombre}
                                        </span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estadoStock.className}`}>
                                    {estadoStock.label}
                                  </span>
                                  {esIncompatible && (
                                    <span
                                      className="inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                      title={infoCompatibilidad.razon}
                                    >
                                      Incompatible
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ImagenProducto
                                src={producto.imagen_url}
                                alt={`Imagen de ${capitalizarPrimeraLetra(producto.nombre)}`}
                                className="mt-3"
                              />

                              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                                {producto.descripcion_tecnica
                                  ? vistaDetalladaProductos
                                    ? producto.descripcion_tecnica
                                    : `${producto.descripcion_tecnica.slice(0, 110)}...`
                                  : 'Sin descripcion tecnica.'}
                              </p>

                              {vistaDetalladaProductos ? (
                                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                                  {specsDetalladas.map(([etiqueta, valor]) => (
                                    <div
                                      key={`${producto.id}-${etiqueta}`}
                                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2"
                                    >
                                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                                        {etiqueta}
                                      </dt>
                                      <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">{valor}</dd>
                                    </div>
                                  ))}
                                </dl>
                              ) : null}

                              {/* Ficha tecnica completa (Icecat/Deltron) — colapsable */}
                              {vistaDetalladaProductos && Array.isArray(producto.ficha_tecnica?.grupos) && producto.ficha_tecnica.grupos.length > 0 ? (
                                <details className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2">
                                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                                    Ficha técnica completa
                                  </summary>
                                  <div className="mt-3 space-y-3">
                                    {producto.ficha_tecnica.grupos.map((g, gi) => (
                                      <div key={`${producto.id}-ficha-${gi}`}>
                                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)]">{g.nombre}</h4>
                                        <dl className="mt-1 grid gap-1.5 sm:grid-cols-2">
                                          {(g.items || []).map((it, ii) => (
                                            <div key={`${producto.id}-ficha-${gi}-${ii}`} className="flex flex-col">
                                              <dt className="text-[11px] text-[var(--color-text-muted)]">{it.etiqueta}</dt>
                                              <dd className="text-xs font-medium text-[var(--color-text)]">{it.valor}</dd>
                                            </div>
                                          ))}
                                        </dl>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              ) : null}

                              {/* Enlace a la ficha del producto en Deltron — solo admin */}
                              {esAdmin && producto.codigo_proveedor ? (
                                <a
                                  href={`https://www.deltron.com.pe/modulos/productos/items/producto.php?item_number=${encodeURIComponent(producto.codigo_proveedor)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-3 inline-flex min-h-11 w-fit items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[var(--radius-sm)]"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  Ver en Deltron
                                </a>
                              ) : null}

                              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                                <p className="text-2xl font-semibold text-[var(--color-accent-text)]">
                                  {esInvitado ? (
                                    <span className="text-base text-[var(--color-text-muted)]">Inicia sesión para ver precio</span>
                                  ) : (
                                    formatearMontoSegunMonedaVista({ montoUsd: producto.precio_base })
                                  )}
                                </p>

                                {!esRam ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {!esPasoExtras && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (yaEnComparador) {
                                            quitarDeComparador(producto.id);
                                          } else {
                                            agregarAComparador(producto);
                                          }
                                        }}
                                        aria-label={`${yaEnComparador ? 'Quitar de comparación' : 'Comparar'}: ${producto.nombre}`}
                                        aria-pressed={yaEnComparador}
                                        className={`min-h-11 min-w-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-higFast ${
                                          yaEnComparador
                                            ? 'bg-[color:rgba(0,122,255,0.15)] text-[var(--color-accent-text)] ring-1 ring-[var(--color-accent)]'
                                            : 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:bg-[color:rgba(0,122,255,0.08)] hover:text-[var(--color-accent-text)]'
                                        }`}
                                      >
                                        {yaEnComparador ? (
                                          <span className="flex items-center gap-1.5">
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                              <path d="m5 12 4 4L19 6" />
                                            </svg>
                                            Comparando
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1.5">
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                              <rect x="3" y="3" width="7" height="18" rx="1" />
                                              <rect x="14" y="3" width="7" height="18" rx="1" />
                                            </svg>
                                            Comparar
                                          </span>
                                        )}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => seleccionarProducto(producto)}
                                      disabled={esIncompatible}
                                      className={`min-h-11 rounded-[var(--radius-sm)] px-4 text-sm font-medium transition-colors duration-higFast ${
                                        esIncompatible
                                          ? 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed'
                                          : seleccionado
                                            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                                            : 'bg-[var(--color-surface-soft)] text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]'
                                      }`}
                                      aria-label={`${seleccionado ? 'Deseleccionar producto' : 'Seleccionar'}: ${producto.nombre}`}
                                      title={esIncompatible ? infoCompatibilidad.razon : ''}
                                    >
                                      {seleccionado ? 'Deseleccionar' : 'Seleccionar'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex max-w-full items-center gap-2 self-start rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
                                    <button
                                      type="button"
                                      onClick={() => quitarRam(producto.id)}
                                      disabled={cantidadRam === 0 || esIncompatible}
                                      className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                      aria-label={`Quitar un modulo de ${producto.nombre}`}
                                      title={esIncompatible ? infoCompatibilidad.razon : ''}
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold">{cantidadRam}</span>
                                    <button
                                      type="button"
                                      onClick={() => seleccionarProducto(producto)}
                                      disabled={cantidadRam >= maxRam || esIncompatible}
                                      className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                      aria-label={`Agregar un modulo de ${producto.nombre}`}
                                      title={esIncompatible ? infoCompatibilidad.razon : ''}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

        </section>

        <div className="relative">
          <aside className="space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto pb-4 pr-1 scrollbar-thin">
          <section className="surface-elevated p-5" data-tour="cotizador-asistente">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Asistente IA</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Solicita una configuracion sugerida segun tu uso y aplicala en un click.</p>
            <div className="mt-4">
              <AsistenteIA onAplicarRecomendacion={aplicarRecomendacionIA} className="!static !w-full !translate-x-0 !translate-y-0 !rounded-[var(--radius-md)] !justify-center" />
            </div>
          </section>

          {/* Embalaje — solo para admin y vendedor (oculto para clientes) */}
          {esPrivilegiado && (
            <SeccionEmbalaje
              activo={embalaje.activo}
              opcion={embalaje.opcion}
              precioBasico={embalaje.precioBasico}
              precioAvanzado={embalaje.precioAvanzado}
              onToggle={handleEmbalajeToggle}
              onCambiarOpcion={handleEmbalajeCambiarOpcion}
              onCambiarPrecio={handleEmbalajeCambiarPrecio}
            />
          )}

          {/* Flete — solo para admin y vendedor (oculto para clientes) */}
          {esPrivilegiado && (
            <SeccionFlete
              activo={flete.activo}
              precio={flete.precio}
              onToggle={handleFleteToggle}
              onCambiarPrecio={handleFleteCambiarPrecio}
            />
          )}

          {/* Resumen financiero admin — solo para admin y vendedor (oculto para clientes) */}
          {esPrivilegiado && (
            cargandoTipoCambio ? (
              <section className="surface-card p-4" aria-label="Cargando tipo de cambio">
                <LoadingSpinner label="Obteniendo tipo de cambio..." />
              </section>
            ) : (
              <ResumenFinancieroAdmin resumen={resumenAdmin} tipoCambio={tipoCambioUsdPen} />
            )
          )}

          <section className="surface-elevated p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Total estimado</p>
            {esInvitado ? (
              <div className="mt-3 rounded-[var(--radius-sm)] bg-[color:rgba(255,214,10,0.10)] p-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text)]">Inicia sesión</span> para ver los precios y el total estimado de tu configuración.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-1 text-3xl font-semibold text-[var(--color-success)]">
                  {formatearMontoSegunMonedaVista({
                    montoUsd: resumenFinanciero.total.usd,
                    montoPen: resumenFinanciero.total.pen
                  })}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{etiquetaMonedaBase(monedaVista)} • {pasosCompletos} de {PASOS.length} pasos completos</p>
                <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                    * Los precios mostrados no incluyen los impuestos aplicables. Los precios están sujetos a cambios a discreción de NSG Latinoamerica E.I.R.L. según disponibilidad y condiciones del mercado.
                  </p>
                </div>

                {/* Botón compartir configuración — visible cuando hay al menos un componente (Req. 10.1, 10.9) */}
                {pasosCompletos > 0 && (
                  <button
                    type="button"
                    onClick={compartirConfiguracion}
                    aria-label="Generar link para compartir configuración"
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higFast hover:bg-[color:rgba(0,122,255,0.08)] hover:text-[var(--color-accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Compartir configuración
                  </button>
                )}
              </>
            )}
          </section>

          {/* Analizador de presupuesto — visible para usuarios autenticados (Req. 11.1–11.10) */}
          {!esInvitado && (
            <AnalizadorPresupuesto
              precioTotalUsd={resumenFinanciero.total.usd}
              precioTotalPen={resumenFinanciero.total.pen}
              monedaVista={monedaVista}
              componentes={componentesSeleccionados}
              tipoCambio={tipoCambioUsdPen}
            />
          )}

          {/* Extras seleccionados */}
          {Object.keys(extras).length > 0 && (            <section className="surface-elevated p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Extras</h3>
              <ul className="mt-3 space-y-1.5">
                {Object.entries(extras).map(([cat, items]) =>
                  items.map(({ producto, cantidad }) => (
                    <li key={`${cat}-${producto.id}`} className="flex items-center justify-between text-sm">
                      <span className="truncate text-[var(--color-text)]">{capitalizarPrimeraLetra(producto.nombre)}</span>
                      <span className="ml-2 shrink-0 text-xs font-medium text-[var(--color-text-muted)]">×{cantidad}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          <section className="surface-elevated p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Compatibilidad</h3>
            {validacionCompatibilidad.errores.length > 0 ? (
              <ErrorState
                title="Incompatibilidades detectadas"
                description={validacionCompatibilidad.errores[0]}
              />
            ) : validacionCompatibilidad.advertencias.length > 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2 text-sm text-[var(--color-warning)]">
                {validacionCompatibilidad.advertencias[0]}
              </div>
            ) : (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)] px-3 py-2 text-sm text-[var(--color-success)]">
                Configuracion valida.
              </div>
            )}
          </section>

          {/* Diagrama visual de compatibilidad — visible cuando hay al menos un componente (Req. 7.2) */}
          <DiagramaCompatibilidad
            configuracionSeleccionada={configuracionSeleccionada}
            incompatibilidades={validacionCompatibilidad.errores}
          />

          {/* Datos del cliente — obligatorios: selecciona una cuenta (correo) o ingresa los datos */}
          {(esPrivilegiado) && (
          <section className="surface-elevated space-y-4 p-5" aria-label="Datos del cliente" data-tour="cotizador-cliente">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Datos del cliente</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Selecciona una cuenta por correo o ingresa los datos del cliente. El correo es obligatorio para generar la cotización.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="nombre-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Nombre
                </span>
                <input
                  id="nombre-cliente"
                  type="text"
                  value={nombreCliente}
                  onChange={(event) => setNombreCliente(event.target.value)}
                  placeholder="Ingrese el nombre"
                  autoComplete="given-name"
                  aria-invalid={hayErrorNombreCliente ? 'true' : 'false'}
                  aria-describedby={hayErrorNombreCliente ? 'error-nombre-cliente' : undefined}
                  className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorNombreCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                />
                {hayErrorNombreCliente ? (
                  <span id="error-nombre-cliente" className="text-xs text-[var(--color-danger)]">
                    El nombre es obligatorio para clientes.
                  </span>
                ) : null}
              </label>

              <label htmlFor="apellidos-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Apellidos
                </span>
                <input
                  id="apellidos-cliente"
                  type="text"
                  value={apellidosCliente}
                  onChange={(event) => setApellidosCliente(event.target.value)}
                  placeholder="Ingrese los apellidos"
                  autoComplete="family-name"
                  className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                />
              </label>

              <label htmlFor="email-cliente" className="flex min-w-0 flex-col gap-1.5 relative">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Correo
                </span>
                <div className="relative">
                  <input
                    id="email-cliente"
                    type="email"
                    value={emailCliente}
                    onChange={(event) => {
                      setEmailCliente(event.target.value);
                      setEmailSeleccionadoIndex(-1);
                      if (esPrivilegiado && emailsRegistrados.length > 0) {
                        setMostrarDropdownEmails(true);
                      }
                    }}
                    onFocus={() => {
                      if (esPrivilegiado && emailsRegistrados.length > 0) {
                        setMostrarDropdownEmails(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setMostrarDropdownEmails(false), 300);
                    }}
                    onKeyDown={(event) => {
                      if (!mostrarDropdownEmails || emailsFiltrados.length === 0) return;

                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setEmailSeleccionadoIndex(prev =>
                          prev < emailsFiltrados.length - 1 ? prev + 1 : prev
                        );
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setEmailSeleccionadoIndex(prev => prev > 0 ? prev - 1 : -1);
                      } else if (event.key === 'Enter' && emailSeleccionadoIndex >= 0) {
                        event.preventDefault();
                        setNombreCliente('');
                        setApellidosCliente('');
                        setTelefonoCliente('');
                        setEmailCliente(emailsFiltrados[emailSeleccionadoIndex]);
                        setMostrarDropdownEmails(false);
                        setEmailSeleccionadoIndex(-1);
                      } else if (event.key === 'Escape') {
                        setMostrarDropdownEmails(false);
                        setEmailSeleccionadoIndex(-1);
                      }
                    }}
                    placeholder="Ingrese su correo electronico"
                    autoComplete="off"
                    aria-invalid={hayErrorEmailCliente ? 'true' : 'false'}
                    aria-describedby={hayErrorEmailCliente ? 'error-email-cliente' : undefined}
                    aria-expanded={mostrarDropdownEmails}
                    aria-controls="email-dropdown"
                    aria-activedescendant={emailSeleccionadoIndex >= 0 ? `email-option-${emailSeleccionadoIndex}` : undefined}
                    role="combobox"
                    className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 pr-9 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorEmailCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                  />
                  {esPrivilegiado && emailsRegistrados.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMostrarDropdownEmails(!mostrarDropdownEmails)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      aria-label="Mostrar emails registrados"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${mostrarDropdownEmails ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  {esPrivilegiado && mostrarDropdownEmails && emailsFiltrados.length > 0 && (
                    <div
                      id="email-dropdown"
                      role="listbox"
                      ref={dropdownEmailsRef}
                      className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[#1c1c1e] shadow-lg"
                    >
                      {emailsFiltrados.map((email, index) => (
                        <button
                          key={email}
                          id={`email-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === emailSeleccionadoIndex}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setNombreCliente('');
                            setApellidosCliente('');
                            setTelefonoCliente('');
                            setEmailCliente(email);
                            setMostrarDropdownEmails(false);
                            setEmailSeleccionadoIndex(-1);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-higNormal ${
                            index === emailSeleccionadoIndex
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]'
                          }`}
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {buscandoCliente && (
                  <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando cliente...
                  </span>
                )}
                {hayErrorEmailCliente ? (
                  <span id="error-email-cliente" className="text-xs text-[var(--color-danger)]">
                    Ingresa un correo valido.
                  </span>
                ) : null}
              </label>

              <label htmlFor="telefono-cliente" className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Teléfono
                </span>
                <input
                  id="telefono-cliente"
                  type="tel"
                  value={telefonoCliente}
                  onChange={(event) => setTelefonoCliente(event.target.value)}
                  placeholder="Ingrese su numero de telefono"
                  autoComplete="tel"
                  aria-invalid={hayErrorTelefonoCliente ? 'true' : 'false'}
                  aria-describedby={hayErrorTelefonoCliente ? 'error-telefono-cliente' : undefined}
                  className={`min-h-11 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-shadow duration-higNormal ease-hig focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${hayErrorTelefonoCliente ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                />
                {hayErrorTelefonoCliente ? (
                  <span id="error-telefono-cliente" className="text-xs text-[var(--color-danger)]">
                    {!telefonoClienteLimpio ? 'El teléfono es obligatorio.' : 'El teléfono debe tener al menos 7 dígitos.'}
                  </span>
                ) : null}
              </label>
            </div>
          </section>
          )}

          {/* Balance final — solo para admin (Req. 3.1, 3.8) */}
          {esAdmin && (
            <BalanceFinal
              productosSeleccionados={productosParaBalance}
              extras={extras}
              margenGanancia={margenGanancia}
              monedaVista={monedaVista}
              formatearMontoSegunMonedaVista={formatearMontoSegunMonedaVista}
            />
          )}

          <section className="surface-elevated space-y-4 p-5" data-tour="cotizador-generar">
            {esInvitado ? (
              <div className="space-y-3">
                <div className="rounded-[var(--radius-sm)] bg-[color:rgba(255,214,10,0.10)] p-3 text-sm text-[var(--color-text-muted)]">
                  <p className="font-medium text-[var(--color-text)]">Inicia sesión para generar cotizaciones</p>
                  <p className="mt-1 text-xs">Solo los usuarios registrados pueden crear cotizaciones y ver precios completos.</p>
                </div>
                <div className="flex gap-3">
                  <Link to="/registro">
                    <Button size="sm">Crear cuenta</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="sm">Iniciar sesión</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <label htmlFor="cantidad-equipos" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">Número de equipos</span>
                  <input
                    id="cantidad-equipos"
                    type="number"
                    min="1"
                    step="1"
                    value={cantidadEquipos}
                    onChange={(e) => setCantidadEquipos(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="min-h-11 w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label="Número de equipos iguales a cotizar"
                  />
                </label>
                {cantidadEquipos > 1 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Se cotizarán {cantidadEquipos} equipos iguales; los totales y el stock se multiplican por {cantidadEquipos}.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={generarCotizacion}
                  disabled={!configuracionCompleta || generando || validacionCompatibilidad.errores.length > 0 || !datosClienteValidos}
                  className="min-h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-success-solid)] px-4 text-sm font-semibold text-[var(--color-on-success)] disabled:opacity-45"
                >
                  {generando ? 'Generando cotizacion...' : 'Generar cotizacion'}
                </button>
                {(configuracionSeleccionada.procesador
                  || configuracionSeleccionada.placa_madre
                  || configuracionSeleccionada.ram?.length > 0
                  || configuracionSeleccionada.almacenamiento
                  || configuracionSeleccionada.gpu
                  || configuracionSeleccionada.fuente
                  || configuracionSeleccionada.case) && (
                  <button
                    type="button"
                    onClick={nuevaCotizacion}
                    disabled={generando}
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] disabled:opacity-45"
                  >
                    Nueva cotización (limpiar todo)
                  </button>
                )}
              </>
            )}

            {errorGenerar ? (
              <ErrorState
                title="No se pudo generar"
                description={errorGenerar}
                onRetry={generarCotizacion}
                retryLabel="Reintentar"
              />
            ) : null}

            {cotizacionGenerada ? (
              <SuccessState
                title="Cotización creada"
                description={`Ticket ${cotizacionGenerada.codigo_ticket} - ${formatearMontoSegunMonedaVista({
                  montoUsd: cotizacionGenerada?.finanzas?.total?.usd ?? cotizacionGenerada.precio_total,
                  montoPen: cotizacionGenerada?.finanzas?.total?.pen
                })}`}
              >
                <div className="space-y-2">
                  {/* WhatsApp y aviso de "sin confirmar": solo para clientes.
                      Admin y vendedor crean la cotizacion ya confirmada, no necesitan este paso. */}
                  {!esPrivilegiado && (
                    <>
                      {/* Acción primaria: confirmar con ventas por WhatsApp */}
                      <button
                        type="button"
                        onClick={confirmarPorWhatsApp}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] bg-[#25D366] px-3 text-base font-bold text-white transition-colors hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.728-.979zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        Confirmar por WhatsApp
                      </button>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Tu cotización queda <strong>Sin confirmar</strong> hasta que el área de ventas la confirme. Una vez confirmada, no podrá modificarse.
                      </p>
                    </>
                  )}
                  {/* Visibles para todos los roles: código de ticket (en description) y descarga PDF */}
                  <button type="button" onClick={copiarTicket} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Copiar codigo</button>
                  <button type="button" onClick={descargarPdf} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Descargar PDF</button>
                  {/* Solo admin: Ver historial y Validar ticket (Req. 4.1–4.5) */}
                  {esAdmin && (
                    <button type="button" onClick={() => navigate('/historial')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">
                      Ver historial
                    </button>
                  )}
                  {esAdmin && (
                    <button type="button" onClick={() => navigate('/validar')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">
                      Validar ticket
                    </button>
                  )}
                  <button type="button" onClick={nuevaCotizacion} className="min-h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-white">Nueva cotizacion</button>
                </div>
              </SuccessState>
            ) : null}
          </section>
        </aside>
        </div>
      </div>

      {/* Panel de comparación — visible cuando hay ≥2 productos (Req. 6.5) */}
      {productosComparar.length >= 2 && (
        <PanelComparador
          productos={productosComparar}
          onQuitarProducto={quitarDeComparador}
        />
      )}
    </div>
  );
}
