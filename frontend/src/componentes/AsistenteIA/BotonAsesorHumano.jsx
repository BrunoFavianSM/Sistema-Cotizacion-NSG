/**
 * BotonAsesorHumano.jsx
 *
 * Botón visible durante toda la conversación para contactar a un asesor humano por WhatsApp.
 * - Icono SVG (person.crop.circle.badge.questionmark equivalente)
 * - Construye URL de WhatsApp con número y mensaje pre-llenado
 * - min-height: 44px, accesible por teclado, ARIA label descriptivo
 *
 * El número de WhatsApp se recibe como prop (no desde env, ya que es frontend).
 *
 * Requisitos: 8.1, 8.3, 8.4, 8.5
 */

// Icono de asesor humano — SF Symbol equivalente: person.crop.circle.badge.questionmark
const IconoAsesor = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-current stroke-[1.5]"
    aria-hidden="true"
  >
    {/* Persona */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
    {/* Signo de interrogación (badge) */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 .414-.168.789-.44 1.06M19.5 10.5c0-.414.168-.789.44-1.06M19.5 10.5h.008"
    />
  </svg>
);

// Icono de WhatsApp simplificado
const IconoWhatsApp = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-current"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Construye el mensaje pre-llenado para WhatsApp
 */
function construirMensajeWhatsApp({ nombreUsuario, perfilUsuario, presupuesto, resumenRequisitos }) {
  const partes = ['Hola, necesito ayuda con mi cotización de PC en NSG.'];

  if (nombreUsuario) {
    partes.push(`Mi nombre es ${nombreUsuario}.`);
  }

  if (perfilUsuario) {
    const etiquetasPerfil = {
      basico: 'Básico',
      intermedio: 'Intermedio',
      avanzado: 'Avanzado',
      gamer_full: 'Gamer Full',
    };
    partes.push(`Perfil identificado: ${etiquetasPerfil[perfilUsuario] || perfilUsuario}.`);
  }

  if (presupuesto) {
    partes.push(`Presupuesto aproximado: S/ ${Number(presupuesto).toLocaleString('es-PE')}.`);
  }

  if (resumenRequisitos) {
    partes.push(`Requisitos: ${resumenRequisitos}`);
  }

  return partes.join(' ');
}

/**
 * Props:
 * - numeroWhatsApp: string — número de ventas configurado, en formato internacional sin + (ej: "51987654321")
 * - nombreUsuario: string | null — nombre del usuario autenticado
 * - perfilUsuario: string | null — perfil identificado (basico, intermedio, avanzado, gamer_full)
 * - presupuesto: number | null — presupuesto en PEN
 * - resumenRequisitos: string | null — resumen de requisitos especiales
 * - variante: "completo" | "compacto" — estilo del botón
 */
export default function BotonAsesorHumano({
  numeroWhatsApp = '',
  nombreUsuario = null,
  perfilUsuario = null,
  presupuesto = null,
  resumenRequisitos = null,
  variante = 'completo',
}) {
  // Sin número de ventas configurado no se puede armar un enlace válido:
  // se omite el botón en lugar de generar un wa.me roto.
  if (!numeroWhatsApp) {
    return null;
  }

  const mensajeTexto = construirMensajeWhatsApp({
    nombreUsuario,
    perfilUsuario,
    presupuesto,
    resumenRequisitos,
  });

  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeTexto)}`;

  const esCompacto = variante === 'compacto';

  return (
    <a
      href={urlWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar con un asesor humano por WhatsApp"
      className={[
        // Dimensiones mínimas para touch target
        'inline-flex items-center gap-2 min-h-[44px]',
        'font-medium text-sm',
        'transition-colors duration-150',
        // Foco accesible
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--color-bg)]',
        // Variante completo: botón con fondo
        !esCompacto && [
          'px-4 py-2.5 rounded-[12px]',
          'bg-[#25D366] text-white',
          'hover:bg-[#1ebe5d] active:bg-[#17a852]',
        ].join(' '),
        // Variante compacto: solo texto con icono
        esCompacto && [
          'px-3 py-2 rounded-[10px]',
          'text-[var(--color-text-muted)]',
          'hover:text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]',
        ].join(' '),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {esCompacto ? (
        <IconoAsesor />
      ) : (
        <IconoWhatsApp />
      )}
      <span>
        {esCompacto ? 'Asesor' : 'Hablar con asesor'}
      </span>
    </a>
  );
}
