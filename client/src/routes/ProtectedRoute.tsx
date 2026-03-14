import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

// TODO (step 1.4): redirect to /login if user is not authenticated
export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  return <>{children ?? <Outlet />}</>;
}
