import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@/app/router';
import AuthContext from '@/features/auth/context/AuthContext';
import { GuestRoute } from '@/features/auth/guards/guest-route';
import { ProtectedRoute } from '@/features/auth/guards/protected-route';
import { RequireRole } from '@/features/auth/guards/require-role';
import type { AuthContextInterface } from '@/features/auth/interface';
import { PERMISSIONS, can, type Permission } from '@/lib/rbac/permissions';
import { ROLES, type Role } from '@/lib/rbac/roles';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import { createToken } from '../../helpers/token';
import { RoleProvider } from '../../helpers/role';

vi.mock('@/features/auth/components/change-pin-dialog', () => ({
  ChangePinDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Change PIN" /> : null,
}));

const DENIED_TITLE = "You don't have access";

/** Maps every guarded route path to the permission its route element declares. */
function guardedRoutePermissions(): Map<string, Permission> {
  const map = new Map<string, Permission>();

  function walk(nodes: Array<Record<string, unknown>>, parent = '') {
    for (const node of nodes) {
      const path = typeof node.path === 'string' ? node.path : undefined;
      const fullPath = path === undefined ? parent : `${parent}/${path}`.replace(/\/+/g, '/');
      const element = node.element as ReactElement<{ permission?: Permission }> | undefined;

      if (element?.type === RequireRole && element.props.permission) {
        map.set(fullPath.replace(/^\//, ''), element.props.permission);
      }
      if (Array.isArray(node.children)) {
        walk(node.children as Array<Record<string, unknown>>, fullPath);
      }
    }
  }

  walk(routes as unknown as Array<Record<string, unknown>>);
  return map;
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(path: string, role: Role | null, element: ReactElement, routePath = '*') {
  return render(
    <RoleProvider role={role}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
          <Route path="/dashboard" element={<div>dashboard destination</div>} />
          <Route path="/sales/new" element={<div>sales destination</div>} />
          <Route path="/" element={<div>login screen</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </RoleProvider>,
  );
}

describe('guarded route table', () => {
  const expected: Record<string, Permission> = {
    dashboard: 'dashboard',
    'sales/new': 'salesCreate',
    inventory: 'inventoryView',
    'inventory/categories': 'categoriesView',
    'inventory/movements': 'stockView',
    sales: 'salesHistory',
    'shifts/summary': 'shiftsView',
    'admin/staff': 'staffView',
    'admin/payment-accounts': 'posAccountsView',
    'admin/stock-reconciliation': 'stockReconcile',
    'admin/audits': 'auditView',
    settings: 'settingsView',
  };

  it('guards every product route with the expected permission', () => {
    const actual = guardedRoutePermissions();

    expect(Object.fromEntries(actual)).toEqual(expected);
  });

  it('only references permissions that exist in PERMISSIONS', () => {
    for (const permission of guardedRoutePermissions().values()) {
      expect(PERMISSIONS[permission]).toBeDefined();
    }
  });
});

describe('RequireRole per route and role', () => {
  const cases = Object.entries({
    'sales/new': 'salesCreate',
    inventory: 'inventoryView',
    'inventory/categories': 'categoriesView',
    'inventory/movements': 'stockView',
    sales: 'salesHistory',
    'shifts/summary': 'shiftsView',
    'admin/staff': 'staffView',
    'admin/payment-accounts': 'posAccountsView',
    'admin/stock-reconciliation': 'stockReconcile',
    'admin/audits': 'auditView',
    settings: 'settingsView',
  } as Record<string, Permission>);

  it.each(
    cases.flatMap(([path, permission]) => ROLES.map((role) => [path, permission, role] as const)),
  )('/%s needs %s: %s is %s', (path, permission, role) => {
    const allowed = can(role, permission);

    renderAt(
      `/${path}`,
      role,
      <RequireRole permission={permission}>
        <div>page body</div>
      </RequireRole>,
      `/${path}`,
    );

    if (allowed) {
      expect(screen.getByText('page body')).toBeInTheDocument();
      expect(screen.queryByText(DENIED_TITLE)).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(DENIED_TITLE)).toBeInTheDocument();
      expect(screen.queryByText('page body')).not.toBeInTheDocument();
    }
  });
});

describe('role change while on a route', () => {
  it('moves the user off a page their new role cannot open', () => {
    const element = (
      <RequireRole permission="auditView">
        <div>audit page</div>
      </RequireRole>
    );

    const { rerender } = render(
      <RoleProvider role="admin">
        <MemoryRouter initialEntries={['/admin/audits']}>
          <Routes>
            <Route path="/admin/audits" element={element} />
            <Route path="/dashboard" element={<div>dashboard destination</div>} />
          </Routes>
        </MemoryRouter>
      </RoleProvider>,
    );

    expect(screen.getByText('audit page')).toBeInTheDocument();

    rerender(
      <RoleProvider role="manager">
        <MemoryRouter initialEntries={['/admin/audits']}>
          <Routes>
            <Route path="/admin/audits" element={element} />
            <Route path="/dashboard" element={<div>dashboard destination</div>} />
          </Routes>
        </MemoryRouter>
      </RoleProvider>,
    );

    expect(screen.getByText('dashboard destination')).toBeInTheDocument();
    expect(screen.queryByText('audit page')).not.toBeInTheDocument();
  });
});

describe('landing redirect per role', () => {
  beforeEach(() => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
  });

  afterEach(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it.each([
    ['cashier', 'sales destination'],
    ['manager', 'dashboard destination'],
    ['admin', 'dashboard destination'],
  ] as const)('sends a signed-in %s to their home', (role, destination) => {
    renderAt(
      '/auth/login',
      role,
      <GuestRoute>
        <div>login form</div>
      </GuestRoute>,
    );

    expect(screen.getByText(destination)).toBeInTheDocument();
    expect(screen.queryByText('login form')).not.toBeInTheDocument();
  });

  it('keeps the login form while the role is unknown', () => {
    renderAt(
      '/auth/login',
      null,
      <GuestRoute>
        <div>login form</div>
      </GuestRoute>,
    );

    expect(screen.getByText('login form')).toBeInTheDocument();
  });
});

describe('must_change_pin', () => {
  beforeEach(() => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
  });

  afterEach(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it('blocks protected pages and shows only the change-PIN dialog', () => {
    const value: AuthContextInterface = {
      isLoading: false,
      staff: null,
      role: 'admin',
      logout: async () => {},
      mustChangePin: true,
      setMustChangePin: () => {},
      requirePinChange: () => {},
      completePinChange: () => {},
    };
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={value}>
          <MemoryRouter initialEntries={['/settings']}>
            <ProtectedRoute permission="settingsView">
              <div>settings page</div>
            </ProtectedRoute>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Change PIN' })).toBeInTheDocument();
    expect(screen.queryByText('settings page')).not.toBeInTheDocument();
  });
});
