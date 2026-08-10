/**
 * Evalúa la fortaleza de una contraseña.
 * Retorna nivel, label, porcentaje y color para el medidor visual.
 */
export function evaluarFortalezaPassword(password) {
  if (!password) {
    return { nivel: 'vacio', label: '', porcentaje: 0, color: 'transparent' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { nivel: 'debil', label: 'Débil', porcentaje: 25, color: 'var(--color-danger)' };
  if (score <= 4) return { nivel: 'media', label: 'Media', porcentaje: 60, color: 'var(--color-warning)' };
  return { nivel: 'fuerte', label: 'Fuerte', porcentaje: 100, color: 'var(--color-success)' };
}