import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes/router';
import { AuthProvider } from './contexts/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
