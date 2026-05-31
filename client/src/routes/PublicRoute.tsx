import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';

export default function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/profiles" replace />;

  return <Outlet />;
}
