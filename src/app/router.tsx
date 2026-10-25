import { createBrowserRouter } from 'react-router';
import { Root } from '@/routes/root';
import { IndexRoute } from '@/routes/index';
import { DashboardRoute } from '@/routes/dashboard';
import { InventoryRoute } from '@/routes/inventory';
import { PosRoute } from '@/routes/pos';
import { SettingsRoute } from '@/routes/settings';
import { NotFoundRoute } from '@/routes/not-found';
import { GuestRoute } from '@/features/auth/guards/guest-route';
import { ProtectedRoute } from '@/features/auth/guards/protected-route';

export const routes = [
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: (
          <GuestRoute>
            <IndexRoute />
          </GuestRoute>
        ),
      },
      {
        path: '/auth/login',
        element: (
          <GuestRoute>
            <IndexRoute />
          </GuestRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute>
            <InventoryRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pos',
        element: (
          <ProtectedRoute>
            <PosRoute />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsRoute />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
