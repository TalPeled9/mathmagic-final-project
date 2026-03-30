import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Navigate to="/profiles" replace />;

  return <Navigate to="/login" replace />;
}
