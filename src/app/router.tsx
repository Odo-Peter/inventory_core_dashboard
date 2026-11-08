import { createBrowserRouter } from 'react-router';
import type { ReactNode } from 'react';

import { Root } from '@/routes/root';
import { GuestRoute } from '@/features/auth/guards/guest-route';
import { ProtectedRoute } from '@/features/auth/guards/protected-route';
import { RequireRole } from '@/features/auth/guards/require-role';
import { AppShell } from '@/components/layout/app-shell';
import type { Permission } from '@/lib/rbac';

import { IndexRoute } from '@/routes/index';
import { DashboardRoute } from '@/routes/dashboard';
import { SettingsRoute } from '@/routes/settings';
import { SalesNewRoute } from '@/routes/sales-new';
import { SalesRoute } from '@/routes/sales';
import { StockMovementsRoute } from '@/routes/stock-movements';
import { ShiftSummaryRoute } from '@/routes/shift-summary';
import { StaffRoute } from '@/routes/staff';
import { PaymentAccountsRoute } from '@/routes/payment-accounts';
import { NotFoundRoute } from '@/routes/not-found';
import { AuditsRoute } from '@/routes/audits';
import { CategoryRoute } from '@/routes/category';
import { ItemRoute } from '@/routes/item';
import { StockReconciliationRoute } from '@/routes/stock-reconciliation-route';

function withPermission(permission: Permission, element: ReactNode) {
  return <RequireRole permission={permission}>{element}</RequireRole>;
}

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
          { path: 'dashboard', element: withPermission('dashboard', <DashboardRoute />) },
          { path: 'sales/new', element: withPermission('salesCreate', <SalesNewRoute />) },
          { path: 'inventory', element: withPermission('inventoryView', <ItemRoute />) },
          {
            path: 'inventory/categories',
            element: withPermission('categoriesView', <CategoryRoute />),
          },
          {
            path: 'inventory/movements',
            element: withPermission('stockView', <StockMovementsRoute />),
          },
          { path: 'sales', element: withPermission('salesHistory', <SalesRoute />) },
          {
            path: 'shifts/summary',
            element: withPermission('shiftsView', <ShiftSummaryRoute />),
          },
          { path: 'admin/staff', element: withPermission('staffView', <StaffRoute />) },
          {
            path: 'admin/payment-accounts',
            element: withPermission('posAccountsView', <PaymentAccountsRoute />),
          },
          {
            path: 'admin/stock-reconciliation',
            element: withPermission('stockReconcile', <StockReconciliationRoute />),
          },
          { path: 'admin/audits', element: withPermission('auditView', <AuditsRoute />) },
          { path: 'settings', element: withPermission('settingsView', <SettingsRoute />) },
        ],
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
