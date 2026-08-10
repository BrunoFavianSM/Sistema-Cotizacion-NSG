import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexto/AppContext';
import { AccessibilityProvider } from './componentes/accesibilidad/AccessibilityProvider';
import AppShell from './componentes/layout/AppShell';
import LoadingSpinner from './componentes/feedback/LoadingSpinner';
import { ToastProvider } from './componentes/feedback/ToastProvider';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import RecuperarContrasena from './paginas/RecuperarContrasena';
import RestablecerContrasena from './paginas/RestablecerContrasena';
import ActivarCuenta from './paginas/ActivarCuenta';
import Cotizador from './paginas/Cotizador';
import ValidadorCotizaciones from './paginas/ValidadorCotizaciones';
import HistorialCliente from './paginas/HistorialCliente';
import AdminProductos from './paginas/AdminProductos';
import AdminUsuarios from './paginas/AdminUsuarios';
import AdminConfiguracion from './paginas/AdminConfiguracion';
import ImportarCSV from './paginas/ImportarCSV';
import Dashboard from './paginas/Dashboard';
import Perfil from './paginas/Perfil';
import ConfiguracionCompartida from './paginas/ConfiguracionCompartida';
import { THEME_STORAGE_KEY, applyThemeClass } from './theme';

/** Ruta protegida: solo admin */
function RutaProtegida({ children }) {
  const { autenticado, cargandoAuth, esAdmin } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-hig1">
        <LoadingSpinner label="Verificando autenticación..." />
      </div>
    );
  }

  if (!autenticado) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/cotizador" replace />;

  return children;
}

/** Ruta protegida: cualquier usuario autenticado (admin o usuario registrado) */
function RutaProtegidaUsuario({ children }) {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-hig1">
        <LoadingSpinner label="Verificando autenticación..." />
      </div>
    );
  }

  if (!autenticado) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/cotizador" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<RecuperarContrasena />} />
          <Route path="/restablecer" element={<RestablecerContrasena />} />
          <Route path="/activar" element={<ActivarCuenta />} />
          <Route path="/cotizador" element={<Cotizador />} />
          <Route path="/historial" element={<RutaProtegidaUsuario><HistorialCliente /></RutaProtegidaUsuario>} />
          <Route path="/validar" element={<RutaProtegidaUsuario><ValidadorCotizaciones /></RutaProtegidaUsuario>} />
          <Route path="/admin" element={<Navigate to="/admin/productos" replace />} />
          <Route path="/admin/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/admin/productos" element={<RutaProtegida><AdminProductos /></RutaProtegida>} />
          <Route path="/admin/usuarios" element={<RutaProtegida><AdminUsuarios /></RutaProtegida>} />
          <Route path="/admin/configuracion" element={<RutaProtegida><AdminConfiguracion /></RutaProtegida>} />
          <Route path="/admin/importar-csv" element={<RutaProtegida><ImportarCSV /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegidaUsuario><Perfil /></RutaProtegidaUsuario>} />
          <Route path="/configuracion" element={<ConfiguracionCompartida />} />
          <Route path="*" element={<Navigate to="/cotizador" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    applyThemeClass(savedTheme);

    if (savedTheme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => applyThemeClass('system');

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
    }

    mediaQuery.addListener(onSystemThemeChange);
    return () => mediaQuery.removeListener(onSystemThemeChange);
  }, []);

  return (
    <AppProvider>
      <AccessibilityProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AccessibilityProvider>
    </AppProvider>
  );
}