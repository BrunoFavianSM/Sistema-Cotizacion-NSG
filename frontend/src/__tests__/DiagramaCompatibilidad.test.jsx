/**
 * Tests para DiagramaCompatibilidad
 *
 * Cubre: renderizado de nodos, colores de líneas según compatibilidad,
 * atributos ARIA.
 *
 * Valida Requisitos: 7.4, 7.5, 7.7
 */

import { render, screen } from '@testing-library/react';
import DiagramaCompatibilidad from '../componentes/cotizador/DiagramaCompatibilidad';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const procesador = { id: 1, nombre: 'Intel Core i9-13900K', socket: 'LGA1700' };
const placaMadre = { id: 2, nombre: 'ASUS ROG Z790', socket: 'LGA1700' };
const ram = [{ id: 3, nombre: 'Corsair 32GB DDR5' }];
const gpu = { id: 4, nombre: 'RTX 4090' };
const fuente = { id: 5, nombre: 'Corsair RM1000x' };

const configCompleta = { procesador, placa_madre: placaMadre, ram, gpu, fuente };
const configParcial = { procesador, placa_madre: null, ram: [], gpu: null, fuente: null };
const configVacia = { procesador: null, placa_madre: null, ram: [], gpu: null, fuente: null };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiagramaCompatibilidad', () => {
  // ── Req. 7.2 — Visibilidad con al menos un componente ───────────────────

  it('no renderiza nada cuando no hay componentes seleccionados (Req. 7.2)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configVacia}
        incompatibilidades={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada cuando configuracionSeleccionada es null', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={null}
        incompatibilidades={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el diagrama cuando hay al menos un componente seleccionado (Req. 7.2)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configParcial}
        incompatibilidades={[]}
      />
    );
    // La section raíz tiene aria-label con "diagrama de compatibilidad"
    expect(screen.getByRole('region', { name: /diagrama de compatibilidad/i })).toBeInTheDocument();
  });

  it('renderiza el diagrama con configuración completa', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByRole('region', { name: /diagrama de compatibilidad/i })).toBeInTheDocument();
  });

  // ── Req. 7.7 — Atributos ARIA ────────────────────────────────────────────

  it('el SVG tiene role="img" (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('el SVG tiene aria-label descriptivo con los componentes seleccionados (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svg = screen.getByRole('img');
    const label = svg.getAttribute('aria-label');
    expect(label).toMatch(/CPU/i);
    expect(label).toMatch(/Motherboard/i);
  });

  it('el aria-label menciona "compatibles" cuando no hay incompatibilidades (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/compatibles/i);
  });

  it('el aria-label menciona las incompatibilidades cuando existen (Req. 7.7)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible: CPU requiere AM5']}
      />
    );
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/incompatibilidades/i);
  });

  // ── Req. 7.5 — Indicador de estado compatible ────────────────────────────

  it('muestra badge "Compatible" en el encabezado cuando no hay incompatibilidades (Req. 7.5)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const badges = screen.getAllByText('Compatible');
    const badgeEncabezado = badges.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeTruthy();
  });

  // ── Req. 7.4 — Indicador de estado incompatible ──────────────────────────

  it('muestra badge "Incompatible" en el encabezado cuando hay incompatibilidades (Req. 7.4)', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible']}
      />
    );
    const badges = screen.getAllByText('Incompatible');
    const badgeEncabezado = badges.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeTruthy();
  });

  it('no muestra badge "Compatible" en el encabezado cuando hay incompatibilidades', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['Socket incompatible']}
      />
    );
    const badgesCompatible = screen.queryAllByText('Compatible');
    const badgeEncabezado = badgesCompatible.find(
      (el) => el.closest('span') && el.closest('span').classList.contains('rounded-full')
    );
    expect(badgeEncabezado).toBeFalsy();
  });

  // ── Leyenda ──────────────────────────────────────────────────────────────

  it('muestra la leyenda con los tres estados de línea', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getAllByText('Compatible').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Incompatible').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sin seleccionar')).toBeInTheDocument();
  });

  // ── Encabezado ───────────────────────────────────────────────────────────

  it('muestra el encabezado "Compatibilidad visual"', () => {
    render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    expect(screen.getByText(/compatibilidad visual/i)).toBeInTheDocument();
  });

  // ── Colores de líneas (verificados via atributos SVG) ────────────────────

  it('las líneas entre componentes compatibles usan gradiente verde (Req. 7.5)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svgPrincipal = container.querySelector('svg[role="img"]');
    // Las líneas activas usan url(#dc-grad-ok) o stroke directo verde
    const lineas = svgPrincipal.querySelectorAll('line');
    const lineasActivas = Array.from(lineas).filter(
      (l) => l.getAttribute('stroke') === 'url(#dc-grad-ok)' || l.getAttribute('stroke') === '#34C759'
    );
    expect(lineasActivas.length).toBeGreaterThan(0);
  });

  it('las líneas con incompatibilidad de socket usan gradiente rojo (Req. 7.4)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={['socket incompatible']}
      />
    );
    const svgPrincipal = container.querySelector('svg[role="img"]');
    const lineas = svgPrincipal.querySelectorAll('line');
    const lineasError = Array.from(lineas).filter(
      (l) => l.getAttribute('stroke') === 'url(#dc-grad-err)' || l.getAttribute('stroke') === '#FF453A'
    );
    expect(lineasError.length).toBeGreaterThan(0);
  });

  // ── Responsividad ────────────────────────────────────────────────────────

  it('el SVG principal tiene clase w-full para ser responsivo (Req. 7.9)', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svgPrincipal = container.querySelector('svg[role="img"]');
    expect(svgPrincipal).toBeTruthy();
    // El SVG es responsivo: tiene clase w-full o width="100%" via style
    const clases = svgPrincipal.className?.baseVal || svgPrincipal.getAttribute('class') || '';
    const estiloWidth = svgPrincipal.style?.width || '';
    const esResponsivo = clases.includes('w-full') || estiloWidth === '100%';
    expect(esResponsivo).toBe(true);
  });

  it('el SVG tiene viewBox definido para escalar correctamente', () => {
    const { container } = render(
      <DiagramaCompatibilidad
        configuracionSeleccionada={configCompleta}
        incompatibilidades={[]}
      />
    );
    const svgPrincipal = container.querySelector('svg[role="img"]');
    expect(svgPrincipal).toHaveAttribute('viewBox');
  });
});
