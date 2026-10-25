import { createBrowserRouter } from 'react-router';
import { Root } from '@/routes/root';
import { IndexRoute } from '@/routes/index';
import { DashboardRoute } from '@/routes/dashboard';
import { InventoryRoute } from '@/routes/inventory';
import { PosRoute } from '@/routes/pos';
import { SettingsRoute } from '@/routes/settings';
import { NotFoundRoute } from '@/routes/not-found';

export const routes = [
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <IndexRoute /> },
      { path: 'dashboard', element: <DashboardRoute /> },
      { path: 'inventory', element: <InventoryRoute /> },
      { path: 'pos', element: <PosRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
