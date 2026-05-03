import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/profiles" replace />;

  return <Navigate to="/login" replace />;
}
