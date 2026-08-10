import '@testing-library/jest-dom';

// Mock window.matchMedia (no disponible en jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo (no implementado en jsdom)
window.scrollTo = jest.fn();

// Mock process.env para compatibilidad con babel-plugin-transform-vite-meta-env
process.env.VITE_API_URL = 'http://localhost:3000/api';

// Mock framer-motion: renderiza elementos HTML planos sin animaciones
jest.mock('framer-motion', () => {
  const React = require('react');

  // Usar forwardRef para evitar warnings de React sobre refs en componentes funcionales
  const passthrough = (tag) =>
    React.forwardRef(({ children, variants, initial, animate, exit, whileHover, whileTap, whileFocus, ...props }, ref) =>
      React.createElement(tag, { ...props, ref }, children)
    );

  return {
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: (_, tag) => passthrough(tag),
      }
    ),
  };
});

// Mock ToastProvider para evitar dependencias de contexto en tests unitarios
jest.mock('./componentes/feedback/ToastProvider', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    show: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  }),
}));
