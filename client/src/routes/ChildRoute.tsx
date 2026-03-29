import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export default function ChildRoute() {
  const { activeChild } = useAuth();

  if (!activeChild) return <Navigate to="/profiles" replace />;

  return <Outlet />;
}
