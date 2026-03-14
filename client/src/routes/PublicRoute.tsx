import { Outlet } from 'react-router-dom';

// TODO (step 1.4): redirect to /profiles if user is already authenticated
export default function PublicRoute() {
  return <Outlet />;
}
