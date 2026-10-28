import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import { createToken } from '../helpers/token';
import { AuthProvider } from '@/features/auth/provider/AuthProvider';

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn().mockResolvedValue([]),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  getCurrentStore: vi.fn().mockResolvedValue({ name: 'Main Store', id: 'store-1' }),
  getAuditActions: vi.fn().mockResolvedValue({ actions: [] }),
  getAudits: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
}));

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function authenticate(expiresInSeconds = 3600) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(expiresInSeconds));
}

afterEach(() => {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
});

describe('app router', () => {
  it('renders the staff login screen at / without app chrome', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Stocktake Dashboard')).not.toBeInTheDocument();
  });

  it('redirects an authenticated visitor away from the sign-in screen', () => {
    authenticate();
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('redirects to the sign-in screen when no token is present', () => {
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('redirects to the sign-in screen when the token is expired', () => {
    authenticate(-60);
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the dashboard inside the app shell', () => {
    authenticate();
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Stocktake Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText("Today's sales")).toBeInTheDocument();
    expect(screen.getByText('$1,284.50')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /theme/i })).not.toBeInTheDocument();
  });

  it('shows the grouped sidebar navigation', () => {
    authenticate();
    renderAt('/dashboard');

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Sale' })).toBeInTheDocument();
  });

  it('reflects the active route in the sidebar', () => {
    authenticate();
    renderAt('/sales/new');

    expect(screen.getByRole('link', { name: 'New Sale' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['/sales/new', 'New Sale'],
    ['/inventory', 'Inventory'],
    ['/sales', 'Sales History'],
    ['/stock-movements', 'Stock Movements'],
    ['/shifts/summary', 'Shift Summary'],
    ['/admin/staff', 'Staff & Access'],
    ['/admin/payment-accounts', 'Payment Accounts'],
    ['/settings', 'Settings'],
    ['/admin/audits', 'Audit logs'],
  ])('renders the %s route', (path, heading) => {
    authenticate();
    renderAt(path);

    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the not-found state for an unknown route', async () => {
    const user = userEvent.setup();
    renderAt('/missing-page');

    expect(screen.getByRole('status')).toHaveTextContent('Not found');
    expect(screen.getByText("This page doesn't exist.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
  });

  it('signs out from the account menu', async () => {
    const user = userEvent.setup();
    authenticate();
    renderAt('/dashboard');

    const accountButton = await screen.findByRole('button', { name: 'Open account menu' });
    await user.click(accountButton);
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
