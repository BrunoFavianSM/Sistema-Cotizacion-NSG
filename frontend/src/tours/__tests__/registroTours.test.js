import { obtenerTourPorRuta, TOURS } from '../registroTours';

describe('registroTours', () => {
  it('resuelve cada ruta a su tour correspondiente', () => {
    expect(obtenerTourPorRuta('/cotizador')?.clave).toBe('cotizador');
    expect(obtenerTourPorRuta('/')?.clave).toBe('cotizador');
    expect(obtenerTourPorRuta('/historial')?.clave).toBe('historial');
    expect(obtenerTourPorRuta('/perfil')?.clave).toBe('perfil');
    expect(obtenerTourPorRuta('/validar')?.clave).toBe('validar');
    expect(obtenerTourPorRuta('/admin/productos')?.clave).toBe('productos');
    expect(obtenerTourPorRuta('/admin/usuarios')?.clave).toBe('usuarios');
    expect(obtenerTourPorRuta('/admin/configuracion')?.clave).toBe('configuracion');
    expect(obtenerTourPorRuta('/admin/importar-csv')?.clave).toBe('importar-csv');
  });

  it('devuelve null para una ruta sin tour', () => {
    expect(obtenerTourPorRuta('/ruta-inexistente')).toBeNull();
    expect(obtenerTourPorRuta('/login')).toBeNull();
  });

  it('solo el tour del cotizador se auto-inicia', () => {
    const autoIniciables = TOURS.filter((tour) => tour.autoIniciar).map((tour) => tour.clave);
    expect(autoIniciables).toEqual(['cotizador']);
  });

  it('cada tour tiene al menos un paso', () => {
    TOURS.forEach((tour) => {
      expect(Array.isArray(tour.pasos)).toBe(true);
      expect(tour.pasos.length).toBeGreaterThan(0);
    });
  });
});
