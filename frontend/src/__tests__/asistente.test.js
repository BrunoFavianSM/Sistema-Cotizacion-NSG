/**
 * Pruebas Unitarias — servicio/asistente (frontend)
 * Cliente HTTP para los endpoints del asistente IA.
 */

import { nuevaSesion, enviarMensaje, validarConfiguracion, obtenerHistorial, obtenerSesion } from '../servicios/asistente';

// Mock de Axios con __esModule para ESM interop
jest.mock('../servicios/api', () => {
  const mockPost = jest.fn();
  const mockGet = jest.fn();
  return {
    __esModule: true,
    default: {
      post: mockPost,
      get: mockGet,
    },
    ASISTENTE_TIMEOUT_MS: 30000,
  };
});

const api = require('../servicios/api').default;

describe('servicio/asistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('nuevaSesion', () => {
    test('crea sesión con usuario_id', async () => {
      api.post.mockResolvedValue({
        data: { exito: true, sesion_id: 'uuid-1' },
      });

      const result = await nuevaSesion(1);

      expect(api.post).toHaveBeenCalledWith('/asistente/nueva-sesion', { usuario_id: 1 }, { timeout: 30000 });
      expect(result.exito).toBe(true);
      expect(result.sesion_id).toBe('uuid-1');
    });

    test('crea sesión sin usuario_id (anónimo)', async () => {
      api.post.mockResolvedValue({
        data: { exito: true, sesion_id: 'uuid-2' },
      });

      const result = await nuevaSesion(null);

      expect(api.post).toHaveBeenCalledWith('/asistente/nueva-sesion', {}, { timeout: 30000 });
      expect(result.exito).toBe(true);
    });

    test('retorna error si falla la petición', async () => {
      api.post.mockRejectedValue({
        response: { data: { mensaje: 'Error interno' } },
      });

      const result = await nuevaSesion(1);

      expect(result.exito).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('enviarMensaje', () => {
    test('envía mensaje correctamente', async () => {
      api.post.mockResolvedValue({
        data: {
          exito: true,
          respuesta: '¿Para qué usarás tu PC?',
          quick_replies: ['Gaming', 'Oficina'],
          semaforo: null,
          configuracion_propuesta: null,
        },
      });

      const result = await enviarMensaje('uuid-1', 'hola', 1);

      expect(api.post).toHaveBeenCalledWith('/asistente/mensaje', expect.objectContaining({
        sesion_id: 'uuid-1',
        mensaje: 'hola',
        usuario_id: 1,
      }), { timeout: 30000 });
      expect(result.exito).toBe(true);
      expect(result.respuesta).toBe('¿Para qué usarás tu PC?');
    });

    test('retorna error si el backend falla', async () => {
      api.post.mockRejectedValue({
        response: { data: { mensaje: 'Sesión no encontrada' } },
      });

      const result = await enviarMensaje('no-existe', 'hola');

      expect(result.exito).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validarConfiguracion', () => {
    test('valida configuración correctamente', async () => {
      api.post.mockResolvedValue({
        data: { valida: true, errores: [], advertencias: [] },
      });

      const result = await validarConfiguracion({
        procesador: 1, placa_madre: 2, ram: [3],
        almacenamiento: 4, gpu: 5, fuente: 6, case: 7,
      });

      expect(result.valida).toBe(true);
    });
  });

  describe('obtenerHistorial', () => {
    test('obtiene historial de usuario', async () => {
      api.get.mockResolvedValue({
        data: { exito: true, sesiones: [{ sesion_id: 'uuid-1' }] },
      });

      const result = await obtenerHistorial(1);

      expect(result.exito).toBe(true);
      expect(result.sesiones).toHaveLength(1);
    });
  });

  describe('obtenerSesion', () => {
    test('obtiene mensajes de una sesión', async () => {
      api.get.mockResolvedValue({
        data: { exito: true, mensajes: [{ rol: 'user', contenido: 'hola' }] },
      });

      const result = await obtenerSesion('uuid-1');

      expect(result.exito).toBe(true);
      expect(result.mensajes).toHaveLength(1);
    });
  });
});
