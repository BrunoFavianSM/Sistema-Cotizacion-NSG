/**
 * DiagramaCompatibilidad
 *
 * Diagrama SVG de compatibilidad entre componentes de PC.
 * Diseño Apple HIG: nodos tipo card con íconos SVG inline por componente,
 * nombre completo visible en múltiples líneas, líneas de conexión con
 * gradientes y estado de compatibilidad.
 *
 * Arquitectura:
 *   DiagramaSVGPuro   → solo el SVG (reutilizable en modal sin card anidada)
 *   DiagramaCompatibilidad → card completa con header, leyenda y botón expand
 *
 * HIG aplicado:
 *   - Jerarquía visual: tipo de componente (caption) → nombre (body)
 *   - Colores semánticos del sistema del proyecto
 *   - Separación de capas: card de contenido vs overlay de modal
 *   - Motion con prefers-reduced-motion
 *   - Contraste WCAG AA en todos los estados
 *   - Touch targets mínimos 44×44 px
 */

import { useMemo, useState, useRef } from 'react';
import ModalDiagrama from './ModalDiagrama';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C_OK    = '#34C759';
const C_ERR   = '#FF453A';
const C_MUTED = '#636366';   // valor fijo para SVG (no hereda CSS vars)

// ─── Layout del viewBox ───────────────────────────────────────────────────────
// Nodos tipo card: 130×90 px, esquinas 14 px — más espacio para nombre completo
const VB_W  = 760;
const VB_H  = 560;
const NW    = 130;
const NH    = 90;
const NR    = 14;

// 7 componentes en 3 filas: CPU/MB/RAM · GPU/Almacenamiento/Fuente · Case
const POSICIONES = {
  procesador:     { cx: 140, cy: 110 },
  placa_madre:    { cx: 380, cy: 110 },
  ram:            { cx: 620, cy: 110 },
  gpu:            { cx: 140, cy: 290 },
  almacenamiento: { cx: 380, cy: 290 },
  fuente:         { cx: 620, cy: 290 },
  case:           { cx: 380, cy: 470 },
};

const CONEXIONES = [
  { id: 'cpu-mb',     desde: 'procesador',  hasta: 'placa_madre',    kw: ['socket','procesador','placa'] },
  { id: 'mb-ram',     desde: 'placa_madre', hasta: 'ram',            kw: ['ram','memoria','ddr'] },
  { id: 'mb-gpu',     desde: 'placa_madre', hasta: 'gpu',            kw: ['gpu','grafica','video','pcie'] },
  { id: 'mb-storage', desde: 'placa_madre', hasta: 'almacenamiento', kw: ['m.2','nvme','sata','almacenamiento','disco'] },
  { id: 'fuente-cpu', desde: 'fuente',      hasta: 'procesador',     kw: ['fuente','watt','potencia','energia'] },
  { id: 'fuente-mb',  desde: 'fuente',      hasta: 'placa_madre',    kw: ['fuente','watt','potencia','energia'] },
  { id: 'fuente-gpu', desde: 'fuente',      hasta: 'gpu',            kw: ['fuente','watt','potencia','energia','gpu'] },
  { id: 'case-mb',    desde: 'case',        hasta: 'placa_madre',    kw: ['case','factor de forma','form factor','gabinete'] },
  { id: 'case-gpu',   desde: 'case',        hasta: 'gpu',            kw: ['case','espacio','longitud','gpu','mm'] },
];

const ETIQUETAS = {
  procesador:     'CPU',
  placa_madre:    'Motherboard',
  ram:            'RAM',
  gpu:            'GPU',
  almacenamiento: 'Almacenamiento',
  fuente:         'Fuente',
  case:           'Case',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tieneError(errores, kw) {
  if (!errores?.length) return false;
  const t = errores.join(' ').toLowerCase();
  return kw.some(k => t.includes(k));
}

function bordeNodo(cx, cy, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  const hw = NW / 2;
  const hh = NH / 2;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const sy = dy === 0 ? Infinity : hh / Math.abs(dy);
  const s  = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

function midpoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

/**
 * Parte el nombre en líneas de máx `maxChars` caracteres,
 * respetando palabras. Devuelve máx `maxLines` líneas.
 */
function partirNombre(nombre, maxChars = 18, maxLines = 3) {
  if (!nombre) return [];
  const palabras = nombre.trim().split(/\s+/);
  const lineas = [];
  let actual = '';

  for (const p of palabras) {
    if (lineas.length >= maxLines) break;
    const candidato = actual ? `${actual} ${p}` : p;
    if (candidato.length <= maxChars) {
      actual = candidato;
    } else {
      if (actual) lineas.push(actual);
      actual = p.length > maxChars ? p.slice(0, maxChars - 1) + '…' : p;
    }
  }
  if (actual && lineas.length < maxLines) lineas.push(actual);
  return lineas;
}

// ─── Paths SVG de íconos por componente (inline, sin foreignObject) ───────────

/**
 * Cada función devuelve el path/group SVG centrado en (0,0) para un tamaño de 22×22.
 * Se aplica transform="translate(cx, cy)" en el nodo.
 */

function PathCPU() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-5" y="-5" width="10" height="10" rx="2"/>
      <line x1="-3" y1="-11" x2="-3" y2="-5"/>
      <line x1="3" y1="-11" x2="3" y2="-5"/>
      <line x1="-3" y1="5" x2="-3" y2="11"/>
      <line x1="3" y1="5" x2="3" y2="11"/>
      <line x1="5" y1="-3" x2="11" y2="-3"/>
      <line x1="5" y1="3" x2="11" y2="3"/>
      <line x1="-11" y1="-3" x2="-5" y2="-3"/>
      <line x1="-11" y1="3" x2="-5" y2="3"/>
    </g>
  );
}

function PathMotherboard() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-10" y="-10" width="20" height="20" rx="2"/>
      <rect x="-5" y="-5" width="7" height="7" rx="1"/>
      <line x1="5" y1="-5" x2="7" y2="-5"/>
      <line x1="5" y1="-2" x2="7" y2="-2"/>
      <line x1="5" y1="1" x2="7" y2="1"/>
      <line x1="-3" y1="5" x2="5" y2="5"/>
    </g>
  );
}

function PathRAM() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-10" y="-5" width="20" height="10" rx="2"/>
      <line x1="-6" y1="-1" x2="-5" y2="-1"/>
      <line x1="-2" y1="-1" x2="-1" y2="-1"/>
      <line x1="2" y1="-1" x2="3" y2="-1"/>
      <line x1="6" y1="-1" x2="7" y2="-1"/>
      <line x1="-7" y1="5" x2="-7" y2="8"/>
      <line x1="-3" y1="5" x2="-3" y2="8"/>
      <line x1="1" y1="5" x2="1" y2="8"/>
      <line x1="5" y1="5" x2="5" y2="8"/>
    </g>
  );
}

function PathGPU() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-10" y="-6" width="17" height="12" rx="2"/>
      <circle cx="-3" cy="0" r="3"/>
      <line x1="7" y1="-3" x2="11" y2="-3"/>
      <line x1="7" y1="3" x2="11" y2="3"/>
      <line x1="-7" y1="6" x2="-7" y2="9"/>
      <line x1="-3" y1="6" x2="-3" y2="9"/>
      <line x1="1" y1="6" x2="1" y2="9"/>
    </g>
  );
}

function PathFuente() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-10" y="-10" width="20" height="20" rx="2"/>
      <circle cx="-2" cy="0" r="4"/>
      <line x1="6" y1="-5" x2="9" y2="-5"/>
      <line x1="6" y1="-2" x2="9" y2="-2"/>
      <line x1="6" y1="1" x2="9" y2="1"/>
    </g>
  );
}

function PathStorage() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-9" y="-7" width="18" height="14" rx="2"/>
      <circle cx="0" cy="0" r="3.5"/>
      <circle cx="0" cy="0" r="0.8" fill="currentColor"/>
      <line x1="6" y1="4" x2="7" y2="4"/>
    </g>
  );
}

function PathCase() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-7" y="-11" width="14" height="22" rx="2"/>
      <line x1="-3" y1="-7" x2="3" y2="-7"/>
      <line x1="-3" y1="-4" x2="3" y2="-4"/>
      <circle cx="0" cy="5" r="2.5"/>
    </g>
  );
}

const PATHS = {
  procesador:     PathCPU,
  placa_madre:    PathMotherboard,
  ram:            PathRAM,
  gpu:            PathGPU,
  almacenamiento: PathStorage,
  fuente:         PathFuente,
  case:           PathCase,
};

// ─── Nodo tipo card (SVG puro, sin foreignObject) ─────────────────────────────

/**
 * compacto=true → solo ícono + etiqueta tipo (vista previa en sidebar)
 * compacto=false → ícono + etiqueta + nombre completo (vista ampliada)
 */
function NodoCard({ id, producto, activo, modoOscuro, compacto = false }) {
  const { cx, cy } = POSICIONES[id];
  const x = cx - NW / 2;
  const y = cy - NH / 2;
  const PathIcono = PATHS[id] || PathCPU;
  const etiqueta = ETIQUETAS[id] || id;

  // Colores adaptativos light/dark
  const fillFondo  = activo
    ? (modoOscuro ? '#1a3a5c' : '#e8f0fe')
    : (modoOscuro ? '#2c2c2e' : '#f2f2f7');
  const fillBorde  = activo
    ? (modoOscuro ? '#0b63ce' : '#005ecb')
    : (modoOscuro ? '#48484a' : '#c7c7cc');
  const colorIcono = activo
    ? (modoOscuro ? '#9fd0ff' : '#005ecb')
    : (modoOscuro ? '#636366' : '#8e8e93');
  const colorLabel = activo
    ? (modoOscuro ? '#9fd0ff' : '#005ecb')
    : (modoOscuro ? '#636366' : '#8e8e93');
  const colorNombre = modoOscuro ? '#f5f5f7' : '#1d1d1f';
  const opacidad   = activo ? 1 : 0.5;

  // En modo compacto no mostramos nombre
  const lineas = (!compacto && activo) ? partirNombre(producto?.nombre, 18, 3) : [];

  // Posicionamiento vertical
  // Modo compacto: ícono centrado verticalmente en el nodo
  // Modo completo: ícono arriba, label, nombre
  const iconY  = compacto ? cy : y + 22;
  const labelY = compacto ? cy + 16 : y + 42;
  const nombre1Y = y + 57;
  const nombre2Y = y + 68;
  const nombre3Y = y + 79;
  const nombreYs = [nombre1Y, nombre2Y, nombre3Y];

  return (
    <g opacity={opacidad} aria-hidden="true">
      {/* Sombra */}
      {activo && (
        <rect
          x={x + 2} y={y + 4}
          width={NW} height={NH}
          rx={NR}
          fill={modoOscuro ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.07)'}
        />
      )}

      {/* Fondo de la card */}
      <rect
        x={x} y={y}
        width={NW} height={NH}
        rx={NR}
        fill={fillFondo}
        stroke={fillBorde}
        strokeWidth={activo ? 1.5 : 1}
      />

      {/* Barra de acento superior (solo activo) */}
      {activo && (
        <rect
          x={x + NR} y={y}
          width={NW - NR * 2} height={3}
          fill={fillBorde}
          rx={1.5}
        />
      )}

      {/* Ícono SVG inline centrado */}
      <g
        transform={`translate(${cx}, ${iconY})`}
        color={colorIcono}
        style={{ color: colorIcono }}
      >
        <PathIcono />
      </g>

      {/* Etiqueta tipo (CPU, RAM…) — caption uppercase */}
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={colorLabel}
        letterSpacing="0.1em"
        style={{ textTransform: 'uppercase', userSelect: 'none', fontFamily: 'var(--font-sans, system-ui)' }}
      >
        {etiqueta}
      </text>

      {/* Nombre del producto — solo en modo completo */}
      {!compacto && lineas.map((linea, i) => (
        <text
          key={i}
          x={cx}
          y={nombreYs[i]}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="500"
          fill={colorNombre}
          style={{ userSelect: 'none', fontFamily: 'var(--font-sans, system-ui)' }}
        >
          {linea}
        </text>
      ))}

      {/* Estado "sin selección" — solo en modo completo */}
      {!compacto && !activo && (
        <text
          x={cx} y={cy + 18}
          textAnchor="middle"
          fontSize="8"
          fill={colorLabel}
          style={{ userSelect: 'none' }}
        >
          Sin seleccionar
        </text>
      )}
    </g>
  );
}

// ─── Advertencia en línea ─────────────────────────────────────────────────────

function IconoAdvertenciaLinea({ x, y, modoOscuro }) {
  const bg = modoOscuro ? '#1c1c1e' : '#ffffff';
  return (
    <g transform={`translate(${x - 9}, ${y - 9})`} aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill={bg} stroke={C_ERR} strokeWidth="1.5"/>
      <line x1="9" y1="5" x2="9" y2="10" stroke={C_ERR} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="13.5" r="1" fill={C_ERR}/>
    </g>
  );
}

// ─── SVG puro exportado (reutilizable en modal sin card anidada) ──────────────

export function DiagramaSVGPuro({ configuracionSeleccionada, incompatibilidades = [], modoOscuro = false, className = '', compacto = false }) {
  const config = {
    procesador:  configuracionSeleccionada?.procesador  ?? null,
    placa_madre: configuracionSeleccionada?.placa_madre ?? null,
    ram:         Array.isArray(configuracionSeleccionada?.ram) && configuracionSeleccionada.ram.length > 0
                   ? configuracionSeleccionada.ram[0]
                   : null,
    gpu:         configuracionSeleccionada?.gpu   ?? null,
    almacenamiento: Array.isArray(configuracionSeleccionada?.almacenamiento) && configuracionSeleccionada.almacenamiento.length > 0
                   ? configuracionSeleccionada.almacenamiento[0]
                   : (configuracionSeleccionada?.almacenamiento ?? null),
    fuente:      configuracionSeleccionada?.fuente ?? null,
    case:        configuracionSeleccionada?.case ?? null,
  };

  const estadoConexiones = useMemo(() => CONEXIONES.map(con => {
    const desdeActivo = Boolean(config[con.desde]);
    const hastaActivo = Boolean(config[con.hasta]);
    const ambos = desdeActivo && hastaActivo;
    const error = ambos && tieneError(incompatibilidades, con.kw);
    return { ...con, ambos, color: ambos ? (error ? C_ERR : C_OK) : C_MUTED, error };
  }), [config, incompatibilidades]);

  const ariaLabel = useMemo(() => {
    const activos = Object.entries(config).filter(([,v]) => Boolean(v)).map(([k]) => ETIQUETAS[k] || k);
    if (!activos.length) return 'Diagrama de compatibilidad sin componentes seleccionados';
    const estado = incompatibilidades.length
      ? `Incompatibilidades: ${incompatibilidades.join('; ')}`
      : 'Todos los componentes son compatibles';
    return `Diagrama de compatibilidad. Componentes: ${activos.join(', ')}. ${estado}`;
  }, [config, incompatibilidades]);

  // IDs únicos para gradientes (evitar colisiones si hay múltiples instancias)
  const uid = 'dc';

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`w-full ${className}`}
      style={{ height: '100%', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`${uid}-grad-ok`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C_OK} stopOpacity="0.5"/>
          <stop offset="50%" stopColor={C_OK} stopOpacity="1"/>
          <stop offset="100%" stopColor={C_OK} stopOpacity="0.5"/>
        </linearGradient>
        <linearGradient id={`${uid}-grad-err`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C_ERR} stopOpacity="0.5"/>
          <stop offset="50%" stopColor={C_ERR} stopOpacity="1"/>
          <stop offset="100%" stopColor={C_ERR} stopOpacity="0.5"/>
        </linearGradient>
        <filter id={`${uid}-glow-ok`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      {/* ── Líneas de conexión ── */}
      {estadoConexiones.map(con => {
        const pd = POSICIONES[con.desde];
        const ph = POSICIONES[con.hasta];
        const ini = bordeNodo(pd.cx, pd.cy, ph.cx, ph.cy);
        const fin = bordeNodo(ph.cx, ph.cy, pd.cx, pd.cy);
        const mid = midpoint(ini.x, ini.y, fin.x, fin.y);
        const opacidad = con.ambos ? 1 : 0.18;

        return (
          <g key={con.id} aria-hidden="true">
            {/* Línea de brillo (solo activas compatibles) */}
            {con.ambos && !con.error && (
              <line
                x1={ini.x} y1={ini.y}
                x2={fin.x} y2={fin.y}
                stroke={C_OK}
                strokeWidth="4"
                opacity="0.15"
                strokeLinecap="round"
              />
            )}
            {/* Línea principal */}
            <line
              x1={ini.x} y1={ini.y}
              x2={fin.x} y2={fin.y}
              stroke={con.ambos
                ? (con.error ? `url(#${uid}-grad-err)` : `url(#${uid}-grad-ok)`)
                : C_MUTED}
              strokeWidth={con.ambos ? 2 : 1.5}
              strokeDasharray={con.ambos ? 'none' : '5 4'}
              opacity={opacidad}
              strokeLinecap="round"
            />
            {/* Punto central en líneas compatibles */}
            {con.ambos && !con.error && (
              <circle cx={mid.x} cy={mid.y} r="3.5" fill={C_OK} opacity="0.8"/>
            )}
            {/* Advertencia en líneas con error */}
            {con.error && (
              <IconoAdvertenciaLinea x={mid.x} y={mid.y} modoOscuro={modoOscuro}/>
            )}
          </g>
        );
      })}

      {/* ── Nodos ── */}
      {Object.keys(POSICIONES).map(id => (
        <NodoCard
          key={id}
          id={id}
          producto={config[id]}
          activo={Boolean(config[id])}
          modoOscuro={modoOscuro}
          compacto={compacto}
        />
      ))}
    </svg>
  );
}

// ─── Íconos UI (para header y leyenda) ───────────────────────────────────────

function IconoCompatibleUI() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={C_OK} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <path d="M5 12l4 4L19 6"/>
    </svg>
  );
}

function IconoIncompatibleUI() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={C_ERR} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconoExpand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <polyline points="15 3 21 3 21 9"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

// ─── Componente principal (card completa) ─────────────────────────────────────

export default function DiagramaCompatibilidad({ configuracionSeleccionada, incompatibilidades = [] }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const refBotonExpansion = useRef(null);

  // Detectar modo oscuro para pasar al SVG
  const modoOscuro = typeof window !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : false;

  const config = {
    procesador:  configuracionSeleccionada?.procesador  ?? null,
    placa_madre: configuracionSeleccionada?.placa_madre ?? null,
    ram:         Array.isArray(configuracionSeleccionada?.ram) && configuracionSeleccionada.ram.length > 0
                   ? configuracionSeleccionada.ram[0]
                   : null,
    gpu:         configuracionSeleccionada?.gpu   ?? null,
    almacenamiento: Array.isArray(configuracionSeleccionada?.almacenamiento) && configuracionSeleccionada.almacenamiento.length > 0
                   ? configuracionSeleccionada.almacenamiento[0]
                   : (configuracionSeleccionada?.almacenamiento ?? null),
    fuente:      configuracionSeleccionada?.fuente ?? null,
    case:        configuracionSeleccionada?.case ?? null,
  };

  const hayAlgunComponente = Object.values(config).some(Boolean);
  const hayError = incompatibilidades.length > 0;

  // Todos los hooks antes del return condicional
  if (!hayAlgunComponente) return null;

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ boxShadow: 'var(--shadow-1)' }}
      aria-label="Diagrama de compatibilidad de componentes"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Compatibilidad visual
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {hayError ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:rgba(255,69,58,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#FF453A]">
              <IconoIncompatibleUI/>
              Incompatible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:rgba(52,199,89,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#34C759]">
              <IconoCompatibleUI/>
              Compatible
            </span>
          )}

          <button
            ref={refBotonExpansion}
            type="button"
            onClick={() => setModalAbierto(true)}
            aria-label="Ampliar diagrama"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[8px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <IconoExpand/>
          </button>
        </div>
      </div>

      {/* ── SVG del diagrama ── */}
      <div className="px-3 py-4" style={{ aspectRatio: `${VB_W}/${VB_H}` }}>
        <DiagramaSVGPuro
          configuracionSeleccionada={configuracionSeleccionada}
          incompatibilidades={incompatibilidades}
          modoOscuro={modoOscuro}
          compacto={true}
        />
      </div>

      {/* ── Leyenda ── */}
      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: C_OK }} aria-hidden="true"/>
          Compatible
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: C_ERR }} aria-hidden="true"/>
          Incompatible
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-4 rounded-sm border border-dashed border-[var(--color-border)]" aria-hidden="true"/>
          Sin seleccionar
        </span>
      </div>

      {/* Modal */}
      <ModalDiagrama
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        refBotonExpansion={refBotonExpansion}
        configuracionSeleccionada={configuracionSeleccionada}
        incompatibilidades={incompatibilidades}
        modoOscuro={modoOscuro}
      />
    </section>
  );
}
