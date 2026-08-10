export const THEME_STORAGE_KEY = 'cotizador-theme';

export const themeOptions = ['light', 'dark', 'system'];

export const designTokens = {
  colors: {
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    surfaceSoft: 'var(--color-surface-soft)',
    border: 'var(--color-border)',
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    accent: 'var(--color-accent)',
    accentSoft: 'var(--color-accent-soft)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    focus: 'var(--color-focus)',
    focusRing: 'var(--color-focus-ring)',
  },
  spacing: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    12: 'var(--space-12)',
    16: 'var(--space-16)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
  shadow: {
    level1: 'var(--shadow-1)',
    level2: 'var(--shadow-2)',
    glass: 'var(--shadow-glass)',
  },
  motion: {
    fast: 'var(--motion-fast)',
    normal: 'var(--motion-normal)',
    slow: 'var(--motion-slow)',
    easing: 'var(--ease-standard)',
  },
};

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference = 'system') {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return getSystemTheme();
}

export function applyThemeClass(preference = 'system') {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const resolved = resolveTheme(preference);
  const root = document.documentElement;

  root.classList.toggle('dark', resolved === 'dark');
  root.setAttribute('data-theme', resolved);

  return resolved;
}
