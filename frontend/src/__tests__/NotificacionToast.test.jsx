/**
 * Tests para NotificacionToast
 *
 * Cubre: renderizado de título y mensaje, botón de cierre,
 * auto-desaparición a los 5 segundos.
 *
 * Valida Requisitos: 5.9, 5.10, 5.11
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificacionToast } from '../componentes/feedback/NotificacionToast';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const notificacionEjemplo = {
  id: 42,
  titulo: 'Cotización creada',
  mensaje: 'Tu cotización NSG-2024-0001 fue generada exitosamente.',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificacionToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ── Renderizado de contenido ─────────────────────────────────────────────

  it('renderiza el título de la notificación (Req. 5.9)', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    expect(screen.getByText('Cotización creada')).toBeInTheDocument();
  });

  it('renderiza el mensaje de la notificación (Req. 5.9)', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    expect(
      screen.getByText('Tu cotización NSG-2024-0001 fue generada exitosamente.')
    ).toBeInTheDocument();
  });

  it('renderiza con role="status" para accesibilidad', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('tiene aria-live="polite" para anunciar la notificación', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  // ── Req. 5.10 — Botón de cierre ──────────────────────────────────────────

  it('muestra botón de cierre con aria-label="Cerrar notificación" (Req. 5.10)', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /cerrar notificación/i })
    ).toBeInTheDocument();
  });

  it('llama a onCerrar con el id correcto al hacer clic en el botón de cierre (Req. 5.10)', () => {
    const onCerrar = jest.fn();
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={onCerrar} />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar notificación/i }));

    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(onCerrar).toHaveBeenCalledWith(notificacionEjemplo.id);
  });

  it('el botón de cierre tiene touch target mínimo de 44px (min-h-11 min-w-11)', () => {
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={jest.fn()} />);
    const boton = screen.getByRole('button', { name: /cerrar notificación/i });
    // Verificar que tiene las clases de touch target mínimo
    expect(boton).toHaveClass('min-h-11');
    expect(boton).toHaveClass('min-w-11');
  });

  // ── Req. 5.11 — Auto-desaparición a los 5 segundos ──────────────────────

  it('llama a onCerrar automáticamente después de 5 segundos (Req. 5.11)', () => {
    const onCerrar = jest.fn();
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={onCerrar} />);

    expect(onCerrar).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(onCerrar).toHaveBeenCalledWith(notificacionEjemplo.id);
  });

  it('no llama a onCerrar antes de los 5 segundos', () => {
    const onCerrar = jest.fn();
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={onCerrar} />);

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('cancela el auto-cierre al hacer clic en el botón de cierre manual', () => {
    const onCerrar = jest.fn();
    render(<NotificacionToast notificacion={notificacionEjemplo} onCerrar={onCerrar} />);

    // Cerrar manualmente antes de los 5 segundos
    fireEvent.click(screen.getByRole('button', { name: /cerrar notificación/i }));
    expect(onCerrar).toHaveBeenCalledTimes(1);

    // Avanzar el tiempo: no debe llamarse de nuevo
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('limpia el timer al desmontar el componente', () => {
    const onCerrar = jest.fn();
    const { unmount } = render(
      <NotificacionToast notificacion={notificacionEjemplo} onCerrar={onCerrar} />
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onCerrar).not.toHaveBeenCalled();
  });

  // ── Notificaciones con distintos IDs ────────────────────────────────────

  it('pasa el id correcto a onCerrar para distintas notificaciones', () => {
    const onCerrar = jest.fn();
    const otraNotificacion = { id: 99, titulo: 'Otra', mensaje: 'Mensaje' };

    render(<NotificacionToast notificacion={otraNotificacion} onCerrar={onCerrar} />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onCerrar).toHaveBeenCalledWith(99);
  });
});
