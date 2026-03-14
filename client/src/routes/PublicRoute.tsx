import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

// TODO (step 1.4): redirect to /profiles if user is already authenticated
export default function PublicRoute({ children }: { children?: ReactNode }) {
  return <>{children ?? <Outlet />}</>;
}
