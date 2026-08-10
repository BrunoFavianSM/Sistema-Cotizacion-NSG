import { filtrarPasosVisibles } from '../driver.config';

describe('filtrarPasosVisibles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('conserva los pasos sin elemento (popover centrado)', () => {
    const pasos = [{ popover: { title: 'Bienvenida' } }];
    expect(filtrarPasosVisibles(pasos)).toHaveLength(1);
  });

  it('conserva un paso cuyo elemento existe en el DOM', () => {
    document.body.innerHTML = '<div data-tour="visible"></div>';
    const pasos = [{ element: '[data-tour="visible"]', popover: {} }];
    expect(filtrarPasosVisibles(pasos)).toHaveLength(1);
  });

  it('descarta un paso cuyo elemento no existe', () => {
    const pasos = [{ element: '[data-tour="ausente"]', popover: {} }];
    expect(filtrarPasosVisibles(pasos)).toHaveLength(0);
  });

  it('mezcla correctamente pasos centrados, presentes y ausentes', () => {
    document.body.innerHTML = '<div data-tour="x"></div>';
    const pasos = [
      { popover: { title: 'Intro' } },
      { element: '[data-tour="x"]', popover: {} },
      { element: '[data-tour="no-existe"]', popover: {} },
    ];
    const resultado = filtrarPasosVisibles(pasos);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].popover.title).toBe('Intro');
  });
});
