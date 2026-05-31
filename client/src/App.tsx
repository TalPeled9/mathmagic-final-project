import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes/router';
import { AuthProvider } from './contexts/AuthProvider';
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  return (
    <AuthProvider>
      <CustomCursor />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
