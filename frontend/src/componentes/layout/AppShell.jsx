import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexto/AppContext';
import { THEME_STORAGE_KEY, applyThemeClass, resolveTheme } from '../../theme';
import { usePollingNotificaciones } from '../../hooks/usePollingNotificaciones';
import { NotificacionesToastContainer } from '../feedback/NotificacionToast';
import BadgeNotificaciones from '../ui/BadgeNotificaciones';
import PanelNotificaciones from '../notificaciones/PanelNotificaciones';
import { useTour } from '../../tours/useTour';

const NAV_ITEMS = [
  {
    key: 'cotizador',
    to: '/cotizador',
    label: 'Cotizador',
    description: 'Configura y genera cotizaciones',
    icon: 'spark',
    group: 'primary',
    showInMobileTab: true,
  },
  {
    key: 'historial',
    to: '/historial',
    label: 'Historial',
    description: 'Consulta cotizaciones previas',
    icon: 'history',
    group: 'primary',
    requiresAuth: true,
    showInMobileTab: true,
  },
  {
    key: 'perfil',
    to: '/perfil',
    label: 'Mi cuenta',
    description: 'Gestiona tus datos y contraseña',
    icon: 'user',
    group: 'primary',
    requiresAuth: true,
    showInMobileTab: false,
  },
  {
    key: 'login',
    to: '/login',
    label: 'Iniciar sesión',
    description: 'Accede a tu cuenta',
    icon: 'lock',
    group: 'secondary',
    guestOnly: true,
    showInMobileTab: true,
  },
  {
    key: 'registro',
    to: '/registro',
    label: 'Crear cuenta',
    description: 'Regístrate para cotizar',
    icon: 'person_add',
    group: 'secondary',
    guestOnly: true,
    showInMobileTab: true,
  },
  {
    key: 'validador',
    to: '/validar',
    label: 'Validador',
    description: 'Valida tickets en tienda',
    icon: 'search',
    group: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    showInMobileTab: true,
  },
  {
    key: 'admin-productos',
    to: '/admin/productos',
    label: 'Productos',
    description: 'Gestiona catálogo y stock',
    icon: 'box',
    group: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    showInMobileTab: true,
    mobileLabel: 'Admin',
  },
  {
    key: 'admin-usuarios',
    to: '/admin/usuarios',
    label: 'Cuentas',
    description: 'Gestiona cuentas y roles',
    icon: 'person_add',
    group: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    showInMobileTab: false,
  },
  {
    key: 'admin-configuracion',
    to: '/admin/configuracion',
    label: 'Configuración',
    description: 'Parámetros del sistema',
    icon: 'sliders',
    group: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    showInMobileTab: false,
  },
  {
    key: 'admin-importar-csv',
    to: '/admin/importar-csv',
    label: 'Importar CSV',
    description: 'Carga masiva de productos',
    icon: 'upload',
    group: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    showInMobileTab: false,
  },
];

const ROUTE_METADATA = [
  {
    match: (pathname) => pathname === '/cotizador',
    title: 'Cotizador de PC',
    subtitle: 'Arma una configuración paso a paso y genera un ticket.',
  },
  {
    match: (pathname) => pathname === '/historial',
    title: 'Historial de Cotizaciones',
    subtitle: 'Consulta tickets emitidos y descarga documentos.',
  },
  {
    match: (pathname) => pathname === '/validar',
    title: 'Validador de Cotizaciones',
    subtitle: 'Verifica tickets y confirma reclamaciones en tienda.',
  },
  {
    match: (pathname) => pathname === '/admin/productos' || pathname === '/admin',
    title: 'Gestión de Productos',
    subtitle: 'Administra catálogo, stock y disponibilidad.',
  },
  {
    match: (pathname) => pathname === '/admin/configuracion',
    title: 'Configuracion del Sistema',
    subtitle: 'Ajusta parametros globales y controles operativos.',
  },
  {
    match: (pathname) => pathname === '/admin/importar-csv',
    title: 'Importacion Masiva',
    subtitle: 'Sincroniza el catalogo mediante archivos CSV de Deltron.',
  },
  {
    match: (pathname) => pathname === '/login',
    title: 'Acceso Administrativo',
    subtitle: 'Inicia sesión para gestionar validaciones y catálogo.',
  },
  {
    match: (pathname) => pathname === '/perfil',
    title: 'Mi cuenta',
    subtitle: 'Gestiona tus datos, contraseña y el estado de tu cuenta.',
  },
];

function resolveRouteMetadata(pathname) {
  return ROUTE_METADATA.find((item) => item.match(pathname)) || {
    title: 'Cotizador',
    subtitle: 'Sistema de cotización',
  };
}

function iconClass(baseClass = '') {
  return `h-5 w-5 ${baseClass}`.trim();
}

function NavIcon({ name, className }) {
  switch (name) {
    case 'spark':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l2.8 5.7L21 10l-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.7 1.1-6.2L3 10l6.2-1.3L12 3z" />
        </svg>
      );
    case 'history':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12a8 8 0 108-8 8.2 8.2 0 00-5.6 2.2M4 4v4h4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l2.8 1.8" />
        </svg>
      );
    case 'lock':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="10" width="16" height="10" rx="2" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10V7a4 4 0 118 0v3" />
        </svg>
      );
    case 'search':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeWidth={1.8} d="M20 20l-3.5-3.5" />
        </svg>
      );
    case 'box':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7.5V16.5L12 21l9-4.5V7.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 12v9" />
        </svg>
      );
    case 'sliders':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeWidth={1.8} d="M4 6h8m3 0h5M4 12h4m3 0h9M4 18h11m3 0h2" />
          <circle cx="12" cy="6" r="2" strokeWidth={1.8} />
          <circle cx="8" cy="12" r="2" strokeWidth={1.8} />
          <circle cx="16" cy="18" r="2" strokeWidth={1.8} />
        </svg>
      );
    case 'menu':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'close':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'logout':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 17l5-5-5-5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12H9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4H7a3 3 0 00-3 3v10a3 3 0 003 3h5" />
        </svg>
      );
    case 'sun':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeWidth={1.8} d="M12 2.5v2.3M12 19.2v2.3M21.5 12h-2.3M4.8 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
        </svg>
      );
    case 'moon':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 14.6A8.5 8.5 0 119.4 4a7 7 0 0010.6 10.6z" />
        </svg>
      );
    case 'currency':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h13M4 17h13M14 4l3 3-3 3M14 14l3 3-3 3" />
        </svg>
      );
    case 'upload':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    case 'person_add':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeWidth={1.8} d="M20 8v6M23 11h-6" />
        </svg>
      );
    case 'user':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      );
    case 'bell':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'help':
      return (
        <svg className={iconClass(className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.4 9.2a2.7 2.7 0 015.1 1.2c0 1.8-2.5 2.2-2.5 3.9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 17.2h.01" />
        </svg>
      );
    default:
      return null;
  }
}

function buildNavigationItems(autenticado, rol) {
  return NAV_ITEMS.filter((item) => {
    if (item.requiresAuth && !autenticado) return false;
    if (item.requiresAdmin && rol !== 'admin') return false;
    if (item.guestOnly && autenticado) return false;
    return true;
  });
}

function subtituloUsuario(autenticado, rol) {
  if (!autenticado) return 'Inicia sesión para ver precios y acceder al asistente IA.';
  if (rol === 'admin') return 'Sesión activa con permisos administrativos.';
  return 'Sesión activa. Puedes crear cotizaciones y usar el asistente.';
}

function SidebarNavLink({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={`${item.label}. ${item.description}`}
      className={({ isActive }) =>
        `group flex w-full min-h-11 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-higNormal ease-hig ${
          isActive
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]'
        }`
      }
    >
      <span className="flex items-center gap-3">
        <NavIcon name={item.icon} className="h-5 w-5" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[0.9375rem] font-medium leading-6">{item.label}</span>
          <span className="truncate text-xs leading-4 text-[var(--color-text-muted)]">{item.description}</span>
        </span>
      </span>
    </NavLink>
  );
}

function MobileDrawer({ open, onClose, navItems, usuario, autenticado, onLogout }) {
  const primaryItems = navItems.filter((item) => item.group === 'primary' || item.group === 'secondary');
  const adminItems = navItems.filter((item) => item.group === 'admin');

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar navegación"
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-xs flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 backdrop-blur-xl lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Cotizador</p>
            <p className="text-sm text-[var(--color-text-muted)]">Navegación</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
            aria-label="Cerrar menú"
          >
            <span className="flex items-center justify-center">
              <NavIcon name="close" />
            </span>
          </button>
        </div>

        <div className="surface-card mb-4 rounded-[var(--radius-lg)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">{autenticado ? (usuario?.nombre || usuario?.username || 'Administrador') : 'Modo visitante'}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {subtituloUsuario(autenticado, usuario?.rol)}
          </p>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Principal</p>
            {primaryItems.map((item) => (
              <SidebarNavLink key={item.key} item={item} onNavigate={onClose} />
            ))}
          </div>

          {adminItems.length > 0 && (
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Administración</p>
              {adminItems.map((item) => (
                <SidebarNavLink key={item.key} item={item} onNavigate={onClose} />
              ))}
            </div>
          )}
        </nav>

        {autenticado && (
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-danger)] transition-colors duration-higNormal ease-hig hover:bg-[color:rgba(255,59,48,0.10)]"
          >
            <span className="flex items-center justify-center gap-2">
              <NavIcon name="logout" className="h-4 w-4" />
              Cerrar sesión
            </span>
          </button>
        )}
      </aside>
    </>
  );
}

function DesktopSidebar({ navItems, usuario, autenticado, onLogout }) {
  const primaryItems = navItems.filter((item) => item.group === 'primary' || item.group === 'secondary');
  const adminItems = navItems.filter((item) => item.group === 'admin');

  return (
    <aside className="surface-glass sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-[var(--color-border)] px-4 pb-6 pt-5 lg:flex" aria-label="Navegación lateral">
      <div className="mb-6 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Sistema</p>
        <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">Cotizador</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Experiencia premium para ventas técnicas</p>
      </div>

      <div className="surface-card mb-6 rounded-[var(--radius-lg)] p-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">{autenticado ? (usuario?.nombre || usuario?.username || 'Administrador') : 'Modo visitante'}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {subtituloUsuario(autenticado, usuario?.rol)}
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pb-2 pr-1">
        <div className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Principal</p>
          {primaryItems.map((item) => (
            <SidebarNavLink key={item.key} item={item} />
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Administración</p>
            {adminItems.map((item) => (
              <SidebarNavLink key={item.key} item={item} />
            ))}
          </div>
        )}
      </nav>

      {autenticado && (
        <button
          type="button"
          onClick={onLogout}
          className="mt-5 min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-danger)] transition-colors duration-higNormal ease-hig hover:bg-[color:rgba(255,59,48,0.10)]"
        >
          <span className="flex items-center justify-center gap-2">
            <NavIcon name="logout" className="h-4 w-4" />
            Cerrar sesión
          </span>
        </button>
      )}
    </aside>
  );
}

function BottomNavigation({ navItems }) {
  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[color:var(--color-glass-bg)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden"
      aria-label="Navegación principal móvil"
    >
      <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => (
          <li key={item.key}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-sm)] px-1 py-1 text-[11px] font-medium leading-tight transition-colors duration-higNormal ease-hig ${
                  isActive
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
              <span className="mt-1 truncate">{item.mobileLabel || item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Botón de ayuda que relanza el tour guiado de la vista actual. */
function BotonAyudaTour({ onLanzar }) {
  return (
    <button
      type="button"
      onClick={onLanzar}
      data-tour="ayuda-tour"
      aria-label="Ver guía de esta pantalla"
      title="Ver guía de esta pantalla"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
    >
      <NavIcon name="help" className="h-5 w-5" />
    </button>
  );
}

export default function AppShell() {
  const { autenticado, usuario, logout, monedaVista, alternarMonedaVista, esInvitado, esAdmin, esVendedor } = useAppContext();
  // El toggle de moneda (USD/PEN) solo lo ven admin y vendedor; el cliente ve siempre PEN.
  const puedeVerMoneda = esAdmin || esVendedor;
  const { tourDisponible, lanzarTour } = useTour();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'system');
  const [panelAbierto, setPanelAbierto] = useState(false);

  // Polling de notificaciones — activo solo cuando el usuario está autenticado (Req. 5.6, 5.7)
  const { notificaciones, conteoNoLeidas: conteoPolling, marcarLeida } = usePollingNotificaciones({ autenticado });

  // Conteo local que puede ser actualizado por PanelNotificaciones al marcar como leídas (Req. 6.9, 6.10)
  const [conteoOverride, setConteoOverride] = useState(null);
  const conteoNoLeidas = conteoOverride !== null ? conteoOverride : conteoPolling;

  // Sincronizar override cuando el polling detecta nuevas notificaciones
  const prevConteoPollingRef = useRef(conteoPolling);
  useEffect(() => {
    if (conteoPolling > prevConteoPollingRef.current) {
      // Llegaron notificaciones nuevas — resetear override para mostrar el conteo real
      setConteoOverride(null);
    }
    prevConteoPollingRef.current = conteoPolling;
  }, [conteoPolling]);

  const navItems = useMemo(() => buildNavigationItems(autenticado, usuario?.rol), [autenticado, usuario?.rol]);
  const mobileTabItems = useMemo(
    () => navItems.filter((item) => item.showInMobileTab).slice(0, autenticado ? 4 : 3),
    [autenticado, navItems]
  );
  const routeMeta = useMemo(() => resolveRouteMetadata(pathname), [pathname]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileDrawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileDrawerOpen]);

  const handleLogout = () => {
    logout();
    setMobileDrawerOpen(false);
    navigate('/cotizador');
  };

  const isDarkMode = resolveTheme(themePreference) === 'dark';

  const handleToggleDarkMode = () => {
    const nextPreference = isDarkMode ? 'light' : 'dark';
    setThemePreference(nextPreference);
    applyThemeClass(nextPreference);
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <a
        href="#app-main-content"
        className="sr-only left-4 top-4 z-50 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed"
      >
        Saltar al contenido principal
      </a>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[19rem_minmax(0,1fr)]">
        <DesktopSidebar navItems={navItems} usuario={usuario} autenticado={autenticado} onLogout={handleLogout} />

        <div className="min-w-0 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color:var(--color-glass-bg)]/90 backdrop-blur-xl" role="banner">
            <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] lg:hidden"
                  aria-label="Abrir navegación"
                >
                  <span className="flex items-center justify-center">
                    <NavIcon name="menu" />
                  </span>
                </button>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--color-text)] sm:text-lg">{routeMeta.title}</p>
                  <p className="hidden truncate text-sm text-[var(--color-text-muted)] sm:block">{routeMeta.subtitle}</p>
                </div>
              </div>

              {autenticado ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {tourDisponible && <BotonAyudaTour onLanzar={lanzarTour} />}
                  <NavLink
                    to="/perfil"
                    aria-label="Ir a mi cuenta"
                    className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-sm text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] md:inline-flex"
                  >
                    <NavIcon name="user" className="h-4 w-4" />
                    {usuario?.nombre || 'Mi cuenta'}
                  </NavLink>

                  {/* Req. 6.2, 6.3, 6.7: ícono de notificaciones con badge — solo para usuarios autenticados (!esInvitado) */}
                  {!esInvitado && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPanelAbierto((prev) => !prev)}
                        aria-label={
                          conteoNoLeidas > 0
                            ? `Notificaciones. ${conteoNoLeidas > 99 ? '99+' : conteoNoLeidas} pendientes`
                            : 'Notificaciones'
                        }
                        aria-expanded={panelAbierto}
                        aria-haspopup="true"
                        className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                      >
                        <NavIcon name="bell" className="h-5 w-5" />
                        {/* Badge superpuesto en esquina superior derecha */}
                        <span className="pointer-events-none absolute -right-1 -top-1">
                          <BadgeNotificaciones conteo={conteoNoLeidas} />
                        </span>
                      </button>

                      {/* PanelNotificaciones — Req. 6.7, 6.8, 6.9, 6.10, 6.12–6.16 */}
                      <PanelNotificaciones
                        abierto={panelAbierto}
                        onCerrar={() => setPanelAbierto(false)}
                        onActualizarConteo={setConteoOverride}
                      />
                    </div>
                  )}

                  {puedeVerMoneda && (
                    <button
                      type="button"
                      onClick={alternarMonedaVista}
                      aria-pressed={monedaVista === 'PEN'}
                      aria-label={`Cambiar moneda de visualizacion. Actual: ${monedaVista}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)]"
                    >
                      <NavIcon name="currency" className="h-4 w-4" />
                      {monedaVista}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleDarkMode}
                    aria-pressed={isDarkMode}
                    aria-label={isDarkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)]"
                  >
                    <NavIcon name={isDarkMode ? 'sun' : 'moon'} className="h-4 w-4" />
                    {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  {tourDisponible && <BotonAyudaTour onLanzar={lanzarTour} />}
                  <button
                    type="button"
                    onClick={handleToggleDarkMode}
                    aria-pressed={isDarkMode}
                    aria-label={isDarkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)]"
                  >
                    <NavIcon name={isDarkMode ? 'sun' : 'moon'} className="h-4 w-4" />
                    {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                  </button>
                  <NavLink
                    to="/registro"
                    className="hidden min-h-11 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] sm:inline-flex"
                  >
                    Crear cuenta
                  </NavLink>
                  <NavLink
                    to="/login"
                    className="hidden min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors duration-higNormal ease-hig hover:opacity-90 sm:inline-flex"
                  >
                    Iniciar sesión
                  </NavLink>
                </div>
              )}
            </div>
          </header>

          <main id="app-main-content" className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        navItems={navItems}
        usuario={usuario}
        autenticado={autenticado}
        onLogout={handleLogout}
      />

      <BottomNavigation navItems={mobileTabItems} />

      {/* Notificaciones del sistema — un toast por notificación nueva (Req. 5.8) */}
      <NotificacionesToastContainer notificaciones={notificaciones} onCerrar={marcarLeida} />
    </div>
  );
}
