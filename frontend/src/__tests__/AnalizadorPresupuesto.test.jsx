/**
 * Tests para AnalizadorPresupuesto
 *
 * Cubre: lógica de comparación, estado de exceso, estado dentro de presupuesto,
 * estado de error por valor inválido, accesibilidad aria-live.
 *
 * Valida Requisitos: 11.2, 11.3, 11.4, 11.8, 11.10
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AnalizadorPresupuesto from '../componentes/cotizador/AnalizadorPresupuesto';

// ── Helpers ───────────────────────────────────────────────────────────────────

const componentesEjemplo = [
  { nombre: 'Intel Core i9-13900K', precio_base: '600' },
  { nombre: 'ASUS ROG Strix Z790', precio_base: '400' },
  { nombre: 'Corsair Vengeance 32GB', precio_base: '120' },
];

function renderAnalizador(props = {}) {
  const defaults = {
    precioTotalUsd: 1000,
    precioTotalPen: 3800,
    monedaVista: 'USD',
    componentes: componentesEjemplo,
    tipoCambio: 3.8,
  };
  return render(<AnalizadorPresupuesto {...defaults} {...props} />);
}

// Obtiene el elemento de estado visible (role="status"), no el sr-only
function getEstadoVisible() {
  return screen.getByRole('status');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnalizadorPresupuesto', () => {
  // ── Renderizado inicial ──────────────────────────────────────────────────

  it('renderiza el campo de presupuesto con label correcto en USD', () => {
    renderAnalizador({ monedaVista: 'USD' });
    expect(screen.getByLabelText(/presupuesto máximo \(USD\)/i)).toBeInTheDocument();
  });

  it('renderiza el campo de presupuesto con label correcto en PEN', () => {
    renderAnalizador({ monedaVista: 'PEN' });
    expect(screen.getByLabelText(/presupuesto máximo \(PEN\)/i)).toBeInTheDocument();
  });

  it('muestra mensaje de estado vacío cuando no hay componentes ni presupuesto', () => {
    renderAnalizador({ componentes: [], precioTotalUsd: 0 });
    expect(
      screen.getByText(/selecciona componentes para analizar tu presupuesto/i)
    ).toBeInTheDocument();
  });

  it('no muestra análisis cuando el campo está vacío', () => {
    renderAnalizador();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // ── Req. 11.3 — Estado excedido ──────────────────────────────────────────

  it('muestra "Presupuesto excedido" cuando precio_total > presupuesto (Req. 11.3)', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(getEstadoVisible()).toHaveTextContent(/presupuesto excedido/i);
  });

  it('muestra el monto de exceso correcto (Req. 11.3)', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    // Exceso = 1500 - 1000 = 500
    expect(getEstadoVisible()).toHaveTextContent(/500\.00/);
  });

  it('muestra el precio total de la configuración en el estado excedido', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(getEstadoVisible()).toHaveTextContent(/1500\.00/);
  });

  // ── Req. 11.4 — Estado dentro del presupuesto ────────────────────────────

  it('muestra "Dentro del presupuesto" cuando precio_total <= presupuesto (Req. 11.4)', () => {
    renderAnalizador({ precioTotalUsd: 800 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(getEstadoVisible()).toHaveTextContent(/dentro del presupuesto/i);
  });

  it('muestra el sobrante correcto cuando está dentro del presupuesto (Req. 11.4)', () => {
    renderAnalizador({ precioTotalUsd: 800 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    // Sobrante = 1000 - 800 = 200
    expect(getEstadoVisible()).toHaveTextContent(/200\.00/);
  });

  it('muestra "Dentro del presupuesto" cuando precio_total === presupuesto (límite exacto)', () => {
    renderAnalizador({ precioTotalUsd: 1000 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(getEstadoVisible()).toHaveTextContent(/dentro del presupuesto/i);
  });

  // ── Req. 11.5 — Recomendaciones de ahorro ───────────────────────────────

  it('muestra recomendaciones de ahorro cuando hay exceso (Req. 11.5)', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });

    expect(screen.getByLabelText(/recomendaciones de ahorro/i)).toBeInTheDocument();
  });

  it('las recomendaciones están ordenadas por precio descendente (Req. 11.5)', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });

    const items = screen.getAllByRole('listitem');
    // El primer item debe ser el más caro (Intel Core i9 = 600)
    expect(items[0]).toHaveTextContent('Intel Core i9-13900K');
    // El segundo debe ser el siguiente más caro (ASUS ROG = 400)
    expect(items[1]).toHaveTextContent('ASUS ROG Strix Z790');
  });

  it('no muestra recomendaciones cuando está dentro del presupuesto', () => {
    renderAnalizador({ precioTotalUsd: 800 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(screen.queryByLabelText(/recomendaciones de ahorro/i)).not.toBeInTheDocument();
  });

  // ── Req. 11.8 — Validación de entrada inválida ───────────────────────────

  it('muestra error de validación con valor negativo (Req. 11.8)', () => {
    renderAnalizador();
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-100' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/valor numérico positivo/i);
  });

  it('marca el input como aria-invalid cuando el valor es negativo (Req. 11.8)', () => {
    renderAnalizador();
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-50' } });

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('no muestra error cuando el campo está vacío', () => {
    renderAnalizador();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── Req. 11.10 — Accesibilidad aria-live ────────────────────────────────

  it('tiene región aria-live="polite" para anunciar cambios de estado (Req. 11.10)', () => {
    renderAnalizador();
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
  });

  it('la región aria-live contiene el mensaje de exceso cuando hay exceso', () => {
    renderAnalizador({ precioTotalUsd: 1500 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toHaveTextContent(/presupuesto excedido/i);
  });

  it('la región aria-live contiene el mensaje de éxito cuando está dentro del presupuesto', () => {
    renderAnalizador({ precioTotalUsd: 800 });
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toHaveTextContent(/dentro del presupuesto/i);
  });

  // ── Req. 11.2 — Comparación en tiempo real ───────────────────────────────

  it('actualiza el análisis en tiempo real al cambiar el presupuesto (Req. 11.2)', () => {
    renderAnalizador({ precioTotalUsd: 1000 });
    const input = screen.getByRole('spinbutton');

    // Primero dentro del presupuesto
    fireEvent.change(input, { target: { value: '1500' } });
    expect(getEstadoVisible()).toHaveTextContent(/dentro del presupuesto/i);

    // Luego excedido
    fireEvent.change(input, { target: { value: '500' } });
    expect(getEstadoVisible()).toHaveTextContent(/presupuesto excedido/i);
  });

  // ── Accesibilidad general ────────────────────────────────────────────────

  it('tiene aria-label en la sección principal', () => {
    renderAnalizador();
    expect(screen.getByRole('region', { name: /analizador de presupuesto/i })).toBeInTheDocument();
  });

  it('el input tiene type="number" para teclado numérico en móvil', () => {
    renderAnalizador();
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });
});
