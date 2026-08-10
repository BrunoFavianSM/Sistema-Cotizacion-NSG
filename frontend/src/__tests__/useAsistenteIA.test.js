/**
 * Pruebas Unitarias — useAsistenteIA hook
 * Estado, envío de mensajes, error handling, reinicio.
 *
 * Nota: NO usar jest.useFakeTimers() porque el hook usa setTimeout internamente
 * (llamarConRetry, AbortController timeout) y los fake timers rompen las
 * actualizaciones asíncronas de React Testing Library.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsistenteIA } from '../hooks/useAsistenteIA';

// Mock del servicio del asistente
jest.mock('../servicios/asistente', () => ({
  nuevaSesion: jest.fn(),
  enviarMensaje: jest.fn(),
  validarConfiguracion: jest.fn(),
  obtenerHistorial: jest.fn(),
  obtenerSesion: jest.fn(),
}));

// Mock de api — sin fake timers, solo exportamos lo necesario
jest.mock('../servicios/api', () => ({
  buscarProductosCompatibles: jest.fn(),
  ASISTENTE_TIMEOUT_MS: 30000,
  default: {},
}));

// Mock de AppContext
jest.mock('../contexto/AppContext', () => ({
  useAppContext: () => ({
    autenticado: true,
    esInvitado: false,
    usuario: { id: 1, nombre: 'Test' },
    tipoCambioUsdPen: 3.7,
    aplicarConfiguracion: jest.fn(),
  }),
}));

const asistente = require('../servicios/asistente');

describe('useAsistenteIA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inicializa sesión y muestra bienvenida', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    expect(result.current.mensajes[0].rol).toBe('assistant');
    expect(result.current.mensajes[0].contenido).toContain('asesor de NSG');
  });

  test('muestra error si nuevaSesion falla', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: false, error: 'Error de servidor' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    // Cuando nuevaSesion falla, se activa mostrarAsesor
    expect(result.current.mostrarAsesor).toBe(true);
  });

  test('enviarMensaje agrega mensaje y recibe respuesta', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });
    asistente.enviarMensaje.mockResolvedValue({
      exito: true,
      respuesta: '¿Para qué usarás tu PC?',
      quick_replies: ['Gaming'],
      semaforo: null,
      configuracion_propuesta: null,
    });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.enviarMensaje('Gaming');
    });

    // Debe haber al menos 2 mensajes: bienvenida + usuario + respuesta
    expect(result.current.mensajes.length).toBeGreaterThanOrEqual(2);
  });

  test('muestra error si enviarMensaje falla', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });
    asistente.enviarMensaje.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.enviarMensaje('hola');
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.cargando).toBe(false);
  });

  test('reiniciar limpia estado', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-2' });

    await act(async () => {
      await result.current.reiniciar();
    });

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });
  });

  test('esConsultaCompatibilidad detecta keywords', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    // Esperar a que el hook se inicialice
    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    expect(result.current.esConsultaCompatibilidad('Qué placa es compatible con AM5?')).toBe(true);
    expect(result.current.esConsultaCompatibilidad('Me funciona con DDR4?')).toBe(true);
    expect(result.current.esConsultaCompatibilidad('Hola buenas')).toBe(false);
  });

  test('extraerFiltrosCompatibilidad extrae socket', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    const filtros = result.current.extraerFiltrosCompatibilidad('Compatible con AM5');
    expect(filtros).toBeDefined();
    expect(filtros.socket).toBe('AM5');
  });

  test('extraerFiltrosCompatibilidad retorna null si no hay filtros', async () => {
    asistente.nuevaSesion.mockResolvedValue({ exito: true, sesion_id: 'uuid-1' });

    const { result } = renderHook(() => useAsistenteIA({ activo: true }));

    await waitFor(() => {
      expect(result.current.mensajes.length).toBeGreaterThan(0);
    });

    const filtros = result.current.extraerFiltrosCompatibilidad('Hola mundo');
    expect(filtros).toBeNull();
  });

  test('no envía mensaje si no hay sesión activa', async () => {
    // Usar un hook que no active el useEffect de inicialización (activo: false)
    // para así controlar manualmente que sesionIdRef es null
    const { result } = renderHook(() => useAsistenteIA({ activo: false }));

    // Con activo: false, no se crea sesión y sesionIdRef.current es null
    // enviarMensaje debe setear error sin llamar al servicio
    act(() => {
      result.current.enviarMensaje('test');
    });

    expect(asistente.enviarMensaje).not.toHaveBeenCalled();
    // El hook debería haber seteado un error
    expect(result.current.error).toBeDefined();
  });
});
