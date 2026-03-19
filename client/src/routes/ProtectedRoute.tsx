import { Outlet } from 'react-router';

// TODO (step 1.4): redirect to /login if user is not authenticated
export default function ProtectedRoute() {
  return <Outlet />;
}
