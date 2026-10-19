import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoadingState from './LoadingState.jsx';

export default function ProtectedGameRoute({ children }) {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Memeriksa sesi pemain…" />;

  if (!session) {
    return <Navigate to="/game/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}