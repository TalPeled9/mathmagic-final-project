import { createBrowserRouter } from 'react-router';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import ChildRoute from './ChildRoute';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProfileSelectionPage from '../pages/profiles/ProfileSelectionPage';
import ChildDashboard from '../pages/child/ChildDashboard';
import AdventureSelectionPage from '../pages/child/AdventureSelectionPage';
import StoryChat from '../pages/child/StoryChat';
import ParentDashboard from '../pages/parent/ParentDashboard';
import ChildDetailsPage from '../pages/parent/ChildDetailsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/profiles', element: <ProfileSelectionPage /> },
      { path: '/parent', element: <ParentDashboard /> },
      { path: '/parent/child/:childId', element: <ChildDetailsPage /> },
      {
        element: <ChildRoute />,
        children: [
          { path: '/child/dashboard', element: <ChildDashboard /> },
          { path: '/child/adventure', element: <AdventureSelectionPage /> },
          { path: '/child/story/:adventureId', element: <StoryChat /> },
        ],
      },
    ],
  },
]);
