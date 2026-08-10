/**
 * Componente de Paginación
 *
 * Proporciona controles de navegación entre páginas con accesibilidad completa.
 */

export default function Paginacion({ paginaActual, totalPaginas, onCambioPagina }) {
  if (totalPaginas <= 1) return null;

  const irAPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas && pagina !== paginaActual) {
      onCambioPagina(pagina);
    }
  };

  const generarBotonesPagina = () => {
    const botones = [];
    const maxBotones = 7;

    if (totalPaginas <= maxBotones) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPaginas; i++) {
        botones.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
      if (paginaActual <= 3) {
        // Inicio: 1 2 3 4 ... última
        botones.push(1, 2, 3, 4, '...', totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        // Final: 1 ... antepenúltima penúltima última
        botones.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
      } else {
        // Medio: 1 ... actual-1 actual actual+1 ... última
        botones.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
      }
    }

    return botones;
  };

  const botones = generarBotonesPagina();

  return (
    <nav
      role="navigation"
      aria-label="Paginación de productos"
      className="flex items-center justify-center gap-2"
    >
      {/* Botón Anterior */}
      <button
        type="button"
        onClick={() => irAPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        aria-label="Página anterior"
        className={[
          'min-h-11 min-w-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
          paginaActual === 1
            ? 'cursor-not-allowed text-[var(--color-text-muted)] opacity-40'
            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
        ].join(' ')}
      >
        ←
      </button>

      {/* Botones de página */}
      {botones.map((boton, index) => {
        if (boton === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="min-h-11 min-w-11 flex items-center justify-center text-sm text-[var(--color-text-muted)]"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        const esActual = boton === paginaActual;

        return (
          <button
            key={boton}
            type="button"
            onClick={() => irAPagina(boton)}
            aria-label={`Página ${boton}`}
            aria-current={esActual ? 'page' : undefined}
            className={[
              'min-h-11 min-w-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              esActual
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
            ].join(' ')}
          >
            {boton}
          </button>
        );
      })}

      {/* Botón Siguiente */}
      <button
        type="button"
        onClick={() => irAPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        aria-label="Página siguiente"
        className={[
          'min-h-11 min-w-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
          paginaActual === totalPaginas
            ? 'cursor-not-allowed text-[var(--color-text-muted)] opacity-40'
            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
        ].join(' ')}
      >
        →
      </button>
    </nav>
  );
}
