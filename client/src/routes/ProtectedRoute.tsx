import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
