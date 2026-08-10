/**
 * SemaforoCapacidades.jsx
 *
 * Visualización de capacidades del sistema con estrellas SVG.
 * - Cinco categorías: Gaming, Edición de Video, Productividad/Oficina, Streaming, Renderizado 3D
 * - Estrellas SVG con role="img" y aria-label descriptivo
 * - Rendering mode "hierarchical": llenas con warning, vacías con text-muted
 * - Al hacer clic en una fila llama onExplicar(categoria)
 * - Adaptado a dark mode con variables semánticas
 *
 * Requisitos: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 9.1, 20.8
 */

// Icono estrella llena — SF Symbol equivalente: star.fill
const EstrellaLlena = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-[var(--color-warning)] stroke-none"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Icono estrella vacía — SF Symbol equivalente: star
const EstrellaVacia = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-[var(--color-text-muted)] stroke-[1.5]"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Iconos de categoría (SF Symbols equivalentes en SVG)
const iconosPorCategoria = {
  gaming: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  ),
  edicion_video: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  productividad: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  ),
  streaming: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
  renderizado_3d: (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
};

// Etiquetas legibles para cada categoría
const etiquetasPorCategoria = {
  gaming: 'Gaming',
  edicion_video: 'Edición de Video',
  productividad: 'Productividad/Oficina',
  streaming: 'Streaming',
  renderizado_3d: 'Renderizado 3D',
};

// Orden de visualización de las categorías
const CATEGORIAS_ORDEN = ['gaming', 'edicion_video', 'productividad', 'streaming', 'renderizado_3d'];

/**
 * Fila individual de capacidad con estrellas
 */
function FilaCapacidad({ clave, puntuacion, max = 5, onExplicar }) {
  const etiqueta = etiquetasPorCategoria[clave] || clave;
  const icono = iconosPorCategoria[clave];

  const manejarClick = () => {
    if (onExplicar) onExplicar(clave);
  };

  const manejarTeclado = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      manejarClick();
    }
  };

  return (
    <button
      type="button"
      onClick={manejarClick}
      onKeyDown={manejarTeclado}
      aria-label={`${etiqueta}: ${puntuacion} de ${max} estrellas. Clic para explicación`}
      className={[
        'flex items-center gap-3 w-full px-3 py-2 rounded-[10px]',
        'text-left cursor-pointer',
        'hover:bg-[var(--color-surface-soft)]',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1',
        'focus-visible:ring-offset-[var(--color-surface)]',
      ].join(' ')}
    >
      {/* Icono de categoría */}
      <span className="text-[var(--color-text-muted)] flex-shrink-0">
        {icono}
      </span>

      {/* Etiqueta */}
      <span className="w-36 text-sm text-[var(--color-text)] flex-shrink-0">
        {etiqueta}
      </span>

      {/* Estrellas */}
      <div
        role="img"
        aria-label={`${puntuacion} de ${max} estrellas para ${etiqueta}`}
        className="flex gap-0.5"
      >
        {Array.from({ length: max }, (_, i) =>
          i < puntuacion ? <EstrellaLlena key={i} /> : <EstrellaVacia key={i} />
        )}
      </div>
    </button>
  );
}

/**
 * Componente principal del semáforo de capacidades
 *
 * Props:
 * - semaforo: { gaming, edicion_video, productividad, streaming, renderizado_3d }
 * - onExplicar: (categoria: string) => void
 */
export default function SemaforoCapacidades({ semaforo = {}, onExplicar }) {
  if (!semaforo || Object.keys(semaforo).length === 0) return null;

  return (
    <section
      aria-label="Semáforo de capacidades del sistema"
      className={[
        'rounded-[14px] border border-[var(--color-border)]',
        'bg-[var(--color-surface)] p-3',
        'flex flex-col gap-1',
      ].join(' ')}
    >
      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide px-3 pb-1">
        Capacidades
      </p>

      {CATEGORIAS_ORDEN.map((clave) => {
        const puntuacion = semaforo[clave] ?? 0;
        return (
          <FilaCapacidad
            key={clave}
            clave={clave}
            puntuacion={puntuacion}
            onExplicar={onExplicar}
          />
        );
      })}
    </section>
  );
}
