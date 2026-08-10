/**
 * Tests para PanelComparador
 *
 * Cubre: límite de 3 productos, resaltado de diferencias, botón de cierre,
 * navegación por teclado.
 *
 * Valida Requisitos: 6.3, 6.4, 6.6, 6.7, 6.8
 */

import { render, screen, fireEvent } from '@testing-library/react';
import PanelComparador from '../componentes/cotizador/PanelComparador';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const productoA = {
  id: 1,
  nombre: 'Intel Core i9-13900K',
  categoria: 'procesador',
  precio_base: '600.00',
  socket: 'LGA1700',
  marca: 'Intel',
};

const productoB = {
  id: 2,
  nombre: 'AMD Ryzen 9 7950X',
  categoria: 'procesador',
  precio_base: '700.00',
  socket: 'AM5',
  marca: 'AMD',
};

const productoC = {
  id: 3,
  nombre: 'Intel Core i7-13700K',
  categoria: 'procesador',
  precio_base: '420.00',
  socket: 'LGA1700',
  marca: 'Intel',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PanelComparador', () => {
  // ── Req. 6.5 — Visibilidad con al menos 2 productos ─────────────────────

  it('no renderiza nada con menos de 2 productos (Req. 6.5)', () => {
    const { container } = render(
      <PanelComparador productos={[productoA]} onQuitarProducto={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada con lista vacía', () => {
    const { container } = render(
      <PanelComparador productos={[]} onQuitarProducto={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada cuando productos es null', () => {
    const { container } = render(
      <PanelComparador productos={null} onQuitarProducto={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el panel con 2 productos (Req. 6.5)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(screen.getByRole('region', { name: /comparación de productos/i })).toBeInTheDocument();
  });

  it('renderiza el panel con 3 productos (Req. 6.3)', () => {
    render(
      <PanelComparador productos={[productoA, productoB, productoC]} onQuitarProducto={jest.fn()} />
    );
    expect(screen.getByText('3 de 3 productos')).toBeInTheDocument();
  });

  // ── Nombres de productos en encabezado ───────────────────────────────────

  it('muestra los nombres de los productos en el encabezado', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(screen.getByText('Intel Core i9-13900K')).toBeInTheDocument();
    expect(screen.getByText('AMD Ryzen 9 7950X')).toBeInTheDocument();
  });

  it('muestra el precio base de cada producto en el encabezado', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(screen.getByText('$600.00')).toBeInTheDocument();
    expect(screen.getByText('$700.00')).toBeInTheDocument();
  });

  // ── Req. 6.6 — Resaltado de diferencias ─────────────────────────────────

  it('muestra las filas de especificaciones en la tabla (Req. 6.6)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    // Socket es diferente entre los dos productos → debe aparecer en la tabla
    expect(screen.getByText('Socket')).toBeInTheDocument();
  });

  it('muestra los valores de socket de cada producto', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(screen.getByText('LGA1700')).toBeInTheDocument();
    expect(screen.getByText('AM5')).toBeInTheDocument();
  });

  it('muestra la leyenda de diferencias al pie del panel', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(
      screen.getByText(/los valores resaltados indican diferencias/i)
    ).toBeInTheDocument();
  });

  // ── Req. 6.7 — Botón de cierre por producto ──────────────────────────────

  it('muestra botón de cierre con aria-label descriptivo por cada producto (Req. 6.7)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    expect(
      screen.getByRole('button', { name: /quitar Intel Core i9-13900K de la comparación/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /quitar AMD Ryzen 9 7950X de la comparación/i })
    ).toBeInTheDocument();
  });

  it('llama a onQuitarProducto con el id correcto al hacer clic en el botón de cierre (Req. 6.7)', () => {
    const onQuitar = jest.fn();
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={onQuitar} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /quitar Intel Core i9-13900K de la comparación/i })
    );

    expect(onQuitar).toHaveBeenCalledTimes(1);
    expect(onQuitar).toHaveBeenCalledWith(productoA.id);
  });

  it('llama a onQuitarProducto con el id del segundo producto al cerrarlo', () => {
    const onQuitar = jest.fn();
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={onQuitar} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /quitar AMD Ryzen 9 7950X de la comparación/i })
    );

    expect(onQuitar).toHaveBeenCalledWith(productoB.id);
  });

  // ── Req. 6.8 — Navegación por teclado ───────────────────────────────────

  it('las columnas de encabezado tienen tabIndex=0 para navegación por teclado (Req. 6.8)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    // Los th de columna de producto deben ser focusables
    const columnHeaders = screen
      .getAllByRole('columnheader')
      .filter((th) => th.getAttribute('tabindex') === '0');
    expect(columnHeaders.length).toBe(2);
  });

  it('navega a la siguiente columna con ArrowRight (Req. 6.8)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    const columnHeaders = screen
      .getAllByRole('columnheader')
      .filter((th) => th.getAttribute('tabindex') === '0');

    const primerCol = columnHeaders[0];
    const segundaCol = columnHeaders[1];

    // Simular foco en la primera columna y presionar ArrowRight
    primerCol.focus();
    fireEvent.keyDown(primerCol, { key: 'ArrowRight' });

    // La segunda columna debe recibir el foco
    expect(document.activeElement).toBe(segundaCol);
  });

  it('navega a la columna anterior con ArrowLeft (Req. 6.8)', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    const columnHeaders = screen
      .getAllByRole('columnheader')
      .filter((th) => th.getAttribute('tabindex') === '0');

    const primerCol = columnHeaders[0];
    const segundaCol = columnHeaders[1];

    // Foco en la segunda columna y presionar ArrowLeft
    segundaCol.focus();
    fireEvent.keyDown(segundaCol, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(primerCol);
  });

  it('no lanza error al presionar ArrowRight en la última columna', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    const columnHeaders = screen
      .getAllByRole('columnheader')
      .filter((th) => th.getAttribute('tabindex') === '0');

    const ultimaCol = columnHeaders[columnHeaders.length - 1];
    ultimaCol.focus();

    expect(() => {
      fireEvent.keyDown(ultimaCol, { key: 'ArrowRight' });
    }).not.toThrow();
  });

  // ── Estructura de tabla accesible ────────────────────────────────────────

  it('usa scope="col" en los encabezados de columna', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    const colHeaders = screen
      .getAllByRole('columnheader')
      .filter((th) => th.getAttribute('scope') === 'col');
    // Al menos la columna "Especificación" + las columnas de producto
    expect(colHeaders.length).toBeGreaterThanOrEqual(3);
  });

  it('usa scope="row" en los encabezados de fila de especificaciones', () => {
    render(
      <PanelComparador productos={[productoA, productoB]} onQuitarProducto={jest.fn()} />
    );
    const rowHeaders = screen
      .getAllByRole('rowheader')
      .filter((th) => th.getAttribute('scope') === 'row');
    expect(rowHeaders.length).toBeGreaterThan(0);
  });
});
