import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock de la fábrica de tours: no ejecutamos driver.js real en los tests.
// Las variables deben llevar prefijo "mock" para que jest permita referenciarlas
// dentro del factory de jest.mock (que se hoistea al inicio del módulo).
const mockDrive = jest.fn();
const mockDestroy = jest.fn();
let mockOpciones = null;

jest.mock('../driver.config', () => ({
  crearTour: jest.fn((opciones) => {
    mockOpciones = opciones;
    return { drive: mockDrive, destroy: mockDestroy };
  }),
}));

// eslint-disable-next-line import/first
import { crearTour } from '../driver.config';
// eslint-disable-next-line import/first
import { useTour, tourYaVisto, marcarTourVisto } from '../useTour';

const wrapperPara = (ruta) =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>;
  };

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  mockOpciones = null;
});

describe('useTour', () => {
  it('indica tour disponible en una ruta con tour', () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapperPara('/cotizador') });
    expect(result.current.tourDisponible).toBe(true);
  });

  it('indica que no hay tour en una ruta sin tour', () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapperPara('/login') });
    expect(result.current.tourDisponible).toBe(false);
  });

  it('auto-inicia el tour del cotizador en la primera visita', () => {
    jest.useFakeTimers();
    try {
      renderHook(() => useTour(), { wrapper: wrapperPara('/cotizador') });
      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(crearTour).toHaveBeenCalledTimes(1);
      expect(mockDrive).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('no auto-inicia si el tour ya fue visto', () => {
    marcarTourVisto('cotizador');
    jest.useFakeTimers();
    try {
      renderHook(() => useTour(), { wrapper: wrapperPara('/cotizador') });
      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(crearTour).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('no auto-inicia en rutas con autoIniciar=false', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useTour(), { wrapper: wrapperPara('/perfil') });
      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(result.current.tourDisponible).toBe(true);
      expect(crearTour).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('al lanzar manualmente y finalizar, marca el tour como visto', () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapperPara('/perfil') });
    act(() => {
      result.current.lanzarTour();
    });
    expect(crearTour).toHaveBeenCalledTimes(1);
    expect(mockDrive).toHaveBeenCalledTimes(1);

    expect(tourYaVisto('perfil')).toBe(false);
    act(() => {
      mockOpciones.onFinalizar();
    });
    expect(tourYaVisto('perfil')).toBe(true);
  });

  it('incluye como último paso el que apunta al botón de ayuda', () => {
    const { result } = renderHook(() => useTour(), { wrapper: wrapperPara('/perfil') });
    act(() => {
      result.current.lanzarTour();
    });
    const pasos = mockOpciones.pasos;
    expect(pasos[pasos.length - 1].element).toBe('[data-tour="ayuda-tour"]');
  });
});
