import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
