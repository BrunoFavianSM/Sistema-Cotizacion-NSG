/**
 * Componente de Protección de Rutas
 *
 * Wrapper que protege rutas administrativas verificando autenticación y rol admin.
 * Redirige a /login si no está autenticado, o a /cotizador si no es admin.
 *
 * NOTA: App.jsx define sus propias RutaProtegida y RutaProtegidaUsuario localmente.
 * Este archivo se mantiene por retrocompatibilidad.
 */

import { Navigate } from 'react-router-dom';
import { useAppContext } from '../contexto/AppContext';

const RutaProtegida = ({ children }) => {
  const { autenticado, cargandoAuth, esAdmin } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!autenticado) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/cotizador" replace />;

  return children;
};

export default RutaProtegida;