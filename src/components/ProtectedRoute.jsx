import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoadingState from './LoadingState.jsx';

// Melindungi rute admin. Validasi sebenarnya tetap di RLS database —
// ini hanya mencegah pengunjung melihat UI admin.
export default function ProtectedRoute({ children }) {
  const { loading, session, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Memeriksa sesi…" />;

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}