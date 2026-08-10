/**
 * ModalDiagrama
 *
 * Overlay de pantalla completa para el diagrama de compatibilidad.
 * - Usa DiagramaSVGPuro directamente (sin card anidada)
 * - Zoom con rueda del ratón (0.5× – 4×)
 * - Pan/arrastre con mouse y touch
 * - Botones de zoom +/- y reset
 * - Escape para cerrar, foco gestionado
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DiagramaSVGPuro } from './DiagramaCompatibilidad';

// ── Constantes ────────────────────────────────────────────────────────────────
const ZOOM_MIN     = 0.4;
const ZOOM_MAX     = 4;
const ZOOM_STEP    = 0.25;
const ZOOM_INICIAL = 1.2;   // zoom por defecto al abrir
const EASING       = [0.22, 1, 0.36, 1];

// ── Íconos ────────────────────────────────────────────────────────────────────

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconoZoomIn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}

function IconoZoomOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}

function IconoReset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}

// ── Hook de zoom/pan ──────────────────────────────────────────────────────────

function useZoomPan(contenedorRef) {
  const [zoom, setZoom]     = useState(ZOOM_INICIAL);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const arrastrandoRef      = useRef(false);
  const ultimoPuntoRef      = useRef({ x: 0, y: 0 });
  // Guardamos zoom y offset en refs para usarlos en el handler de wheel
  // sin necesidad de re-registrar el listener cada vez que cambian
  const zoomRef   = useRef(ZOOM_INICIAL);
  const offsetRef = useRef({ x: 0, y: 0 });

  const resetear = useCallback(() => {
    zoomRef.current   = ZOOM_INICIAL;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(ZOOM_INICIAL);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Sincronizar refs con state
  const actualizarZoom = useCallback((nuevoZoom, nuevoOffset) => {
    zoomRef.current   = nuevoZoom;
    offsetRef.current = nuevoOffset;
    setZoom(nuevoZoom);
    setOffset(nuevoOffset);
  }, []);

  const cambiarZoomDesde = useCallback((delta, origenX, origenY) => {
    const prev     = zoomRef.current;
    const prevOff  = offsetRef.current;
    const siguiente = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
    if (siguiente === prev) return;

    let nuevoOffset = prevOff;
    if (origenX !== undefined && origenY !== undefined && contenedorRef.current) {
      const rect = contenedorRef.current.getBoundingClientRect();
      const px = origenX - rect.left;
      const py = origenY - rect.top;
      nuevoOffset = {
        x: px - (px - prevOff.x) * (siguiente / prev),
        y: py - (py - prevOff.y) * (siguiente / prev),
      };
    }
    actualizarZoom(siguiente, nuevoOffset);
  }, [contenedorRef, actualizarZoom]);

  // Rueda del ratón → zoom
  // NOTA: El listener se registra en el componente principal (ModalDiagrama)
  // donde tenemos control del ciclo de vida del modal.
  // Este useEffect queda vacío intencionalmente.

  // Mouse drag
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    arrastrandoRef.current = true;
    ultimoPuntoRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!arrastrandoRef.current) return;
    const dx = e.clientX - ultimoPuntoRef.current.x;
    const dy = e.clientY - ultimoPuntoRef.current.y;
    ultimoPuntoRef.current = { x: e.clientX, y: e.clientY };
    const nuevoOffset = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
    offsetRef.current = nuevoOffset;
    setOffset(nuevoOffset);
  }, []);

  const onMouseUp = useCallback((e) => {
    arrastrandoRef.current = false;
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
  }, []);

  // Touch drag
  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    arrastrandoRef.current = true;
    ultimoPuntoRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!arrastrandoRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - ultimoPuntoRef.current.x;
    const dy = e.touches[0].clientY - ultimoPuntoRef.current.y;
    ultimoPuntoRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const nuevoOffset = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
    offsetRef.current = nuevoOffset;
    setOffset(nuevoOffset);
  }, []);

  const onTouchEnd = useCallback(() => {
    arrastrandoRef.current = false;
  }, []);

  return {
    zoom, offset, resetear,
    zoomIn:  () => cambiarZoomDesde(+ZOOM_STEP),
    zoomOut: () => cambiarZoomDesde(-ZOOM_STEP),
    cambiarZoomDesde,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp, onTouchStart, onTouchMove, onTouchEnd },
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ModalDiagrama({
  abierto,
  onCerrar,
  refBotonExpansion,
  configuracionSeleccionada,
  incompatibilidades = [],
  modoOscuro = false,
}) {
  const refContenedor   = useRef(null);
  // Usamos callback ref para el área del diagrama para que el wheel listener
  // se registre exactamente cuando el elemento se monta en el DOM
  const refAreaDiagrama = useRef(null);
  const setRefAreaDiagrama = useCallback((el) => {
    refAreaDiagrama.current = el;
  }, []);

  const prefiereMenosMovimiento =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duracion = prefiereMenosMovimiento ? 0 : 0.22;

  const variantesFondo = {
    oculto:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: duracion } },
    salida:  { opacity: 0, transition: { duration: duracion } },
  };

  const variantesModal = {
    oculto:  { opacity: 0, scale: prefiereMenosMovimiento ? 1 : 0.96, y: prefiereMenosMovimiento ? 0 : 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: duracion, ease: EASING } },
    salida:  { opacity: 0, scale: prefiereMenosMovimiento ? 1 : 0.96, y: prefiereMenosMovimiento ? 0 : 8, transition: { duration: duracion, ease: EASING } },
  };

  // Zoom/pan
  const { zoom, offset, resetear, zoomIn, zoomOut, handlers, cambiarZoomDesde } = useZoomPan(refAreaDiagrama);

  // Foco, Escape, scroll lock y wheel zoom
  useEffect(() => {
    if (!abierto) return;

    const frameId = requestAnimationFrame(() => refContenedor.current?.focus());

    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKey);

    const scrollY = window.scrollY;
    document.body.style.overflow  = 'hidden';
    document.body.style.position  = 'fixed';
    document.body.style.top       = `-${scrollY}px`;
    document.body.style.width     = '100%';

    // Wheel zoom — se registra aquí donde sabemos que el modal está abierto
    // y el ref del área ya está asignado (el portal se monta síncronamente)
    const registrarWheelConDelay = () => {
      const el = refAreaDiagrama.current;
      if (!el) return null;

      const onWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rawDelta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
        const delta = rawDelta < 0 ? ZOOM_STEP : -ZOOM_STEP;
        cambiarZoomDesde(delta, e.clientX, e.clientY);
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    };

    // Pequeño delay para que el portal esté completamente montado
    let limpiarWheel = null;
    const t = setTimeout(() => {
      limpiarWheel = registrarWheelConDelay();
    }, 30);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t);
      limpiarWheel?.();
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow  = '';
      document.body.style.position  = '';
      document.body.style.top       = '';
      document.body.style.width     = '';
      window.scrollTo?.(0, scrollY);
      refBotonExpansion?.current?.focus();
    };
  }, [abierto, onCerrar, refBotonExpansion, cambiarZoomDesde]);

  // Resetear zoom al abrir (zoom inicial 1.2×)
  useEffect(() => {
    if (abierto) {
      // Pequeño delay para que el portal esté montado antes de resetear
      const t = setTimeout(() => resetear(), 50);
      return () => clearTimeout(t);
    }
  }, [abierto, resetear]);

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <motion.div
          key="modal-diagrama-fondo"
          variants={variantesFondo}
          initial="oculto"
          animate="visible"
          exit="salida"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
        >
          <motion.div
            key="modal-diagrama-contenido"
            ref={refContenedor}
            role="dialog"
            aria-modal="true"
            aria-label="Diagrama de compatibilidad ampliado"
            tabIndex={-1}
            variants={variantesModal}
            initial="oculto"
            animate="visible"
            exit="salida"
            className="relative flex flex-col w-[95vw] h-[92vh] max-w-[1400px] rounded-[18px] outline-none overflow-hidden"
            style={{
              background: modoOscuro ? '#1c1c1e' : '#ffffff',
              border: `1px solid ${modoOscuro ? '#3a3a3c' : '#d2d2d7'}`,
              boxShadow: modoOscuro
                ? '0 24px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)'
                : '0 24px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)',
            }}
          >
            {/* ── Barra superior ── */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-3.5"
              style={{
                borderBottom: `1px solid ${modoOscuro ? '#3a3a3c' : '#e5e5ea'}`,
                background: modoOscuro ? 'rgba(44,44,46,0.8)' : 'rgba(242,242,247,0.8)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Título */}
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="h-4 w-4"
                  style={{ color: modoOscuro ? '#aeaeb2' : '#6e6e73' }}
                  aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
                <span
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: modoOscuro ? '#f5f5f7' : '#1d1d1f' }}
                >
                  Compatibilidad de componentes
                </span>
                {/* Badge estado */}
                {incompatibilidades.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Incompatible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden="true">
                      <path d="M5 12l4 4L19 6"/>
                    </svg>
                    Compatible
                  </span>
                )}
              </div>

              {/* Controles derecha */}
              <div className="flex items-center gap-1.5">
                {/* Indicador de zoom */}
                <span
                  className="hidden sm:inline-block rounded-md px-2 py-1 text-xs font-mono font-semibold tabular-nums"
                  style={{
                    background: modoOscuro ? '#2c2c2e' : '#f2f2f7',
                    color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                    minWidth: '3.5rem',
                    textAlign: 'center',
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>

                {/* Zoom out */}
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_MIN}
                  aria-label="Reducir zoom"
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[8px] transition-colors disabled:opacity-40"
                  style={{
                    color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = modoOscuro ? '#2c2c2e' : '#f2f2f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconoZoomOut/>
                </button>

                {/* Zoom in */}
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_MAX}
                  aria-label="Aumentar zoom"
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[8px] transition-colors disabled:opacity-40"
                  style={{
                    color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = modoOscuro ? '#2c2c2e' : '#f2f2f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconoZoomIn/>
                </button>

                {/* Reset */}
                <button
                  type="button"
                  onClick={resetear}
                  aria-label="Restablecer vista"
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[8px] transition-colors"
                  style={{
                    color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = modoOscuro ? '#2c2c2e' : '#f2f2f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconoReset/>
                </button>

                {/* Separador */}
                <div
                  className="mx-1 h-5 w-px"
                  style={{ background: modoOscuro ? '#3a3a3c' : '#d2d2d7' }}
                  aria-hidden="true"
                />

                {/* Cerrar */}
                <button
                  type="button"
                  onClick={onCerrar}
                  aria-label="Cerrar diagrama"
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[8px] transition-colors"
                  style={{
                    color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = modoOscuro ? '#2c2c2e' : '#f2f2f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <IconoCerrar/>
                </button>
              </div>
            </div>

            {/* ── Área del diagrama con zoom/pan ── */}
            <div
              ref={setRefAreaDiagrama}
              className="relative flex-1 overflow-hidden select-none"
              style={{
                cursor: 'grab',
                background: modoOscuro
                  ? 'radial-gradient(ellipse at 50% 40%, #1e2a3a 0%, #0d0d0f 100%)'
                  : 'radial-gradient(ellipse at 50% 40%, #eef3fb 0%, #f5f5f7 100%)',
              }}
              {...handlers}
            >
              {/* Grid de puntos decorativo */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <pattern id="dc-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1"
                      fill={modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dc-grid)"/>
              </svg>

              {/* Contenedor transformable — translate3d fuerza GPU layer y evita borrosidad */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate3d(${Math.round(offset.x)}px, ${Math.round(offset.y)}px, 0) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/*
                 * El SVG es vectorial — no se borra al escalar.
                 * Se usa un div contenedor grande para que el pan funcione
                 * más allá de los bordes del área visible.
                 */}
                <div style={{ width: '85%', maxWidth: '960px' }}>
                  <DiagramaSVGPuro
                    configuracionSeleccionada={configuracionSeleccionada}
                    incompatibilidades={incompatibilidades}
                    modoOscuro={modoOscuro}
                  />
                </div>
              </div>

              {/* Hint de interacción */}
              <div
                className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-medium"
                style={{
                  background: modoOscuro ? 'rgba(44,44,46,0.85)' : 'rgba(255,255,255,0.85)',
                  color: modoOscuro ? '#aeaeb2' : '#6e6e73',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${modoOscuro ? '#3a3a3c' : '#e5e5ea'}`,
                }}
              >
                Rueda para zoom · Arrastra para mover
              </div>
            </div>

            {/* ── Leyenda inferior ── */}
            <div
              className="flex shrink-0 flex-wrap items-center gap-5 px-5 py-3"
              style={{
                borderTop: `1px solid ${modoOscuro ? '#3a3a3c' : '#e5e5ea'}`,
                background: modoOscuro ? 'rgba(44,44,46,0.6)' : 'rgba(242,242,247,0.6)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="flex items-center gap-1.5 text-[11px]"
                style={{ color: modoOscuro ? '#aeaeb2' : '#6e6e73' }}>
                <span className="inline-block h-2 w-5 rounded-sm" style={{ background: '#34C759' }} aria-hidden="true"/>
                Compatible
              </span>
              <span className="flex items-center gap-1.5 text-[11px]"
                style={{ color: modoOscuro ? '#aeaeb2' : '#6e6e73' }}>
                <span className="inline-block h-2 w-5 rounded-sm" style={{ background: '#FF453A' }} aria-hidden="true"/>
                Incompatible
              </span>
              <span className="flex items-center gap-1.5 text-[11px]"
                style={{ color: modoOscuro ? '#aeaeb2' : '#6e6e73' }}>
                <span className="inline-block h-2 w-5 rounded-sm border border-dashed"
                  style={{ borderColor: modoOscuro ? '#3a3a3c' : '#d2d2d7' }} aria-hidden="true"/>
                Sin seleccionar
              </span>
              <span
                className="ml-auto text-[11px]"
                style={{ color: modoOscuro ? '#636366' : '#8e8e93' }}
              >
                Esc para cerrar
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
