import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

// TODO (step 1.4): redirect to /profiles if no active child is selected
export default function ChildRoute({ children }: { children?: ReactNode }) {
  return <>{children ?? <Outlet />}</>;
}
