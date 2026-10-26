import { createBrowserRouter } from 'react-router';
import { Root } from '@/routes/root';
import { IndexRoute } from '@/routes/index';
import { DashboardRoute } from '@/routes/dashboard';
import { InventoryRoute } from '@/routes/inventory';
import { PosRoute } from '@/routes/pos';
import { SettingsRoute } from '@/routes/settings';
import { SalesNewRoute } from '@/routes/sales-new';
import { SalesRoute } from '@/routes/sales';
import { StockMovementsRoute } from '@/routes/stock-movements';
import { ShiftSummaryRoute } from '@/routes/shift-summary';
import { StaffRoute } from '@/routes/staff';
import { PaymentAccountsRoute } from '@/routes/payment-accounts';
import { NotFoundRoute } from '@/routes/not-found';
import { AppShell } from '@/components/layout/app-shell';
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
        path: 'auth/login',
        element: (
          <GuestRoute>
            <IndexRoute />
          </GuestRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <DashboardRoute /> },
          { path: 'sales/new', element: <SalesNewRoute /> },
          { path: 'inventory', element: <InventoryRoute /> },
          { path: 'sales', element: <SalesRoute /> },
          { path: 'stock-movements', element: <StockMovementsRoute /> },
          { path: 'shifts/summary', element: <ShiftSummaryRoute /> },
          { path: 'admin/staff', element: <StaffRoute /> },
          { path: 'admin/payment-accounts', element: <PaymentAccountsRoute /> },
          { path: 'settings', element: <SettingsRoute /> },
          { path: 'pos', element: <PosRoute /> },
        ],
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
