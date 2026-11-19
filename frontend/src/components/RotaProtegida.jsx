import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ somenteEquipe = false }) {
  const { usuario, saiu } = useAuth();
  const location = useLocation();

  if (!usuario && saiu) return <Navigate to="/" replace />;
  if (!usuario) return <Navigate to="/entrar" replace state={{ de: location }} />;
  if (somenteEquipe && !usuario.is_staff) return <Navigate to="/minhas-denuncias" replace />;
  return <Outlet />;
}
