/**
 * Tests para ModalDiagrama
 *
 * Cubre: apertura/cierre, atributos ARIA, gestión de foco,
 * cierre con Escape, botón de cierre, zoom/pan, touch target.
 *
 * Valida Requisitos: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import ModalDiagrama from '../componentes/cotizador/ModalDiagrama';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const procesador = { id: 1, nombre: 'Intel Core i9-13900K', socket: 'LGA1700' };
const placaMadre = { id: 2, nombre: 'ASUS ROG Z790', socket: 'LGA1700' };
const ram = [{ id: 3, nombre: 'Corsair 32GB DDR5' }];
const gpu = { id: 4, nombre: 'RTX 4090' };
const fuente = { id: 5, nombre: 'Corsair RM1000x' };

const configCompleta = { procesador, placa_madre: placaMadre, ram, gpu, fuente };

function renderModal(props = {}) {
  const refBoton = createRef();
  const onCerrar = jest.fn();

  const defaults = {
    abierto: true,
    onCerrar,
    refBotonExpansion: refBoton,
    configuracionSeleccionada: configCompleta,
    incompatibilidades: [],
  };

  const result = render(<ModalDiagrama {...defaults} {...props} />);
  return { ...result, onCerrar, refBoton };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ModalDiagrama', () => {
  // ── Req. 1.2 — Apertura como overlay ─────────────────────────────────────

  it('renderiza el modal cuando abierto=true (Req. 1.2)', () => {
    renderModal({ abierto: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('no renderiza el modal cuando abierto=false (Req. 1.2)', () => {
    renderModal({ abierto: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── Req. 1.7 — Atributos ARIA ─────────────────────────────────────────────

  it('el contenedor tiene role="dialog" (Req. 1.7)', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('el contenedor tiene aria-modal="true" (Req. 1.7)', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('el contenedor tiene aria-label="Diagrama de compatibilidad ampliado" (Req. 1.7)', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Diagrama de compatibilidad ampliado');
  });

  // ── Req. 1.4 — Botón de cierre ────────────────────────────────────────────

  it('el botón de cierre tiene aria-label="Cerrar diagrama" (Req. 1.4)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Cerrar diagrama' })).toBeInTheDocument();
  });

  it('el botón de cierre tiene touch target mínimo 36×36 px (Req. 1.4)', () => {
    renderModal();
    const boton = screen.getByRole('button', { name: 'Cerrar diagrama' });
    // El botón tiene min-h-[36px] min-w-[36px] (touch target en barra de herramientas)
    expect(boton.className).toMatch(/min-h-\[36px\]/);
    expect(boton.className).toMatch(/min-w-\[36px\]/);
  });

  it('llama a onCerrar al hacer clic en el botón de cierre (Req. 1.4)', () => {
    const { onCerrar } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar diagrama' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  // ── Req. 1.5 — Cerrar con Escape ─────────────────────────────────────────

  it('llama a onCerrar al presionar Escape (Req. 1.5)', () => {
    const { onCerrar } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('no llama a onCerrar al presionar otras teclas', () => {
    const { onCerrar } = renderModal();
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onCerrar).not.toHaveBeenCalled();
  });

  // ── Req. 1.6 — Gestión de foco ────────────────────────────────────────────

  it('el contenedor del modal tiene tabIndex=-1 para recibir foco (Req. 1.6)', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('tabindex', '-1');
  });

  // ── Req. 1.3 — Tamaño ≥ 90% del viewport ─────────────────────────────────

  it('el contenedor del modal tiene clases de tamaño w-[95vw] h-[92vh] (Req. 1.3)', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/w-\[95vw\]/);
    expect(dialog.className).toMatch(/h-\[92vh\]/);
  });

  // ── Req. 1.8 — Estilos de diseño ─────────────────────────────────────────

  it('el contenedor tiene border-radius de 18px (Req. 1.8)', () => {
    renderModal();
    expect(screen.getByRole('dialog').className).toMatch(/rounded-\[18px\]/);
  });

  it('el overlay tiene backdrop-blur-md (Req. 1.8)', () => {
    renderModal();
    const overlay = document.body.querySelector('.backdrop-blur-md');
    expect(overlay).not.toBeNull();
  });

  // ── Req. 1.3 — Renderiza el SVG del diagrama ─────────────────────────────

  it('renderiza el SVG del diagrama dentro del modal (Req. 1.3)', () => {
    renderModal();
    // El SVG puro tiene role="img" con aria-label del diagrama
    const svgs = document.body.querySelectorAll('svg[role="img"]');
    expect(svgs.length).toBeGreaterThan(0);
  });

  // ── Controles de zoom ─────────────────────────────────────────────────────

  it('tiene botón de zoom in (Req. zoom)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument();
  });

  it('tiene botón de zoom out (Req. zoom)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Reducir zoom' })).toBeInTheDocument();
  });

  it('tiene botón de restablecer vista (Req. zoom)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Restablecer vista' })).toBeInTheDocument();
  });

  // ── Cierre al hacer clic en el fondo ─────────────────────────────────────

  it('llama a onCerrar al hacer clic en el fondo del overlay', () => {
    const { onCerrar } = renderModal();
    const overlay = document.body.querySelector('.backdrop-blur-md');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  // ── Limpieza del listener de Escape al desmontar ──────────────────────────

  it('elimina el listener de Escape al desmontar el modal', () => {
    const { onCerrar, unmount } = renderModal();
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).not.toHaveBeenCalled();
  });

  // ── Hint de interacción ───────────────────────────────────────────────────

  it('muestra el hint de zoom y arrastre', () => {
    renderModal();
    expect(screen.getByText(/rueda para zoom/i)).toBeInTheDocument();
  });
});
