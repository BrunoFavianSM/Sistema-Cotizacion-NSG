const SYMBOL_BY_CURRENCY = {
  USD: '$',
  PEN: 'S/'
};

export function normalizarMoneda(moneda = 'USD') {
  const codigoMoneda = String(moneda || 'USD').toUpperCase();
  return SYMBOL_BY_CURRENCY[codigoMoneda] ? codigoMoneda : 'USD';
}

export function formatearMoneda(valor, moneda = 'USD') {
  const codigoMoneda = normalizarMoneda(moneda);
  const simbolo = SYMBOL_BY_CURRENCY[codigoMoneda] || codigoMoneda;
  const monto = Number(valor || 0);
  return `${simbolo} ${monto.toFixed(2)}`;
}

export function convertirMoneda(valor, monedaOrigen = 'USD', monedaDestino = 'USD', tipoCambioUsdPen = 1) {
  const origen = normalizarMoneda(monedaOrigen);
  const destino = normalizarMoneda(monedaDestino);
  const monto = Number(valor || 0);
  const tipoCambio = Number(tipoCambioUsdPen || 1);

  if (origen === destino) return monto;
  if (!Number.isFinite(tipoCambio) || tipoCambio <= 0) return monto;
  if (origen === 'USD' && destino === 'PEN') return monto * tipoCambio;
  if (origen === 'PEN' && destino === 'USD') return monto / tipoCambio;
  return monto;
}

export function resolverMontoPorMoneda({ montoUsd = 0, montoPen, monedaVista = 'USD', tipoCambioUsdPen = 1 }) {
  const moneda = normalizarMoneda(monedaVista);
  if (moneda === 'USD') return Number(montoUsd || 0);
  if (montoPen !== undefined && montoPen !== null) return Number(montoPen || 0);
  return convertirMoneda(Number(montoUsd || 0), 'USD', 'PEN', tipoCambioUsdPen);
}

export function etiquetaMonedaBase(moneda = 'USD') {
  const codigoMoneda = normalizarMoneda(moneda);
  if (codigoMoneda === 'USD') return 'USD (base)';
  if (codigoMoneda === 'PEN') return 'PEN (base)';
  return `${codigoMoneda} (base)`;
}
