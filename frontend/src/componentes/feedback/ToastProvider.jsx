import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { sileo, Toaster } from 'sileo';
import { THEME_STORAGE_KEY, resolveTheme } from '../../theme';

// Contador para IDs únicos — evita que toasts consecutivos se reemplacen entre sí
// (sileo usa "sileo-default" cuando no se provee id, lo que colapsa múltiples toasts)
let _toastId = 0;
const nextId = () => `toast-${++_toastId}`;

// ─── Contexto ────────────────────────────────────────────────────────────────
// Mantiene el mismo contrato público que el ToastProvider anterior:
//   toast.success(title, description?, options?)
//   toast.error(title, description?, options?)
//   toast.warning(title, description?, options?)
//   toast.info(title, description?, options?)
//   toast.show({ title, description, tone, duration })
//   toast.dismiss(id)
// ─────────────────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

/**
 * Convierte los argumentos del contrato anterior (title, description, options)
 * al formato de opciones de sileo.
 */
function buildOptions(title, description = '', options = {}) {
  const { duration, ...rest } = options;
  return {
    id: nextId(),
    title,
    ...(description ? { description } : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...rest,
  };
}

export function ToastProvider({ children }) {
  // ── Sincronización de tema ────────────────────────────────────────────────
  // Lee el tema guardado en localStorage (puede ser 'light', 'dark' o 'system').
  // Si es 'system', resuelve contra prefers-color-scheme.
  // Se suscribe a cambios de localStorage (otras pestañas) y a mutaciones del
  // atributo data-theme en <html> (cambios en la misma pestaña).
  const [sileoTheme, setSileoTheme] = useState(() => {
    const pref = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    return resolveTheme(pref); // 'light' | 'dark'
  });

  useEffect(() => {
    const sync = () => {
      const pref = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
      setSileoTheme(resolveTheme(pref));
    };

    // Cambios desde otra pestaña
    window.addEventListener('storage', sync);

    // Cambios en la misma pestaña: observar data-theme en <html>
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Cambio del OS cuando el tema guardado es 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', sync);

    return () => {
      window.removeEventListener('storage', sync);
      observer.disconnect();
      mq.removeEventListener('change', sync);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────
  const api = useMemo(
    () => ({
      success: (title, description = '', options = {}) =>
        sileo.success(buildOptions(title, description, options)),

      error: (title, description = '', options = {}) =>
        sileo.error(buildOptions(title, description, options)),

      warning: (title, description = '', options = {}) =>
        sileo.warning(buildOptions(title, description, options)),

      info: (title, description = '', options = {}) =>
        sileo.info(buildOptions(title, description, options)),

      /** Compatibilidad con llamadas show({ title, description, tone, duration }) */
      show: ({ title, description = '', tone = 'info', duration, ...rest } = {}) => {
        const opts = buildOptions(title, description, { duration, ...rest });
        const method = sileo[tone] ?? sileo.info;
        return method(opts);
      },

      dismiss: (id) => sileo.dismiss(id),
    }),
    []
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/*
        Toaster montado aquí para que viva dentro del árbol de providers.
        - theme="system" respeta prefers-color-scheme (dark mode automático).
        - position="top-right" mantiene la posición anterior.
        - offset={{ top: 16, right: 16 }} equivale al top-3/top-4 anterior.
        - roundness=14 alineado con el radio de cards del design system (14px).
        - fill oscuro en dark, claro en light vía theme="system".
      */}
      <Toaster
        position="top-right"
        theme={sileoTheme}
        offset={{ top: 16, right: 16 }}
        options={{
          roundness: 14,
          duration: 2800,
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }

  return context;
}
