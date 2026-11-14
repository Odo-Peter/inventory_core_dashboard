import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/router';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import { createToken } from '../helpers/token';
import { AuthProvider } from '@/features/auth/provider/AuthProvider';

// AuthProvider revokes the session through axios directly. Without this mock
// the expired-token case sends a real request whose 401 lands during a later
// test and signs that render out.
vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
  changePin: vi.fn(),
  myProfile: vi.fn().mockResolvedValue({
    id: 'staff-1',
    name: 'Ada Lovelace',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'admin',
    store_id: 'store-1',
    must_change_pin: false,
    active_shift_id: null,
    staff_code: 'ADMIN001',
    store_name: 'Main Store',
  }),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn().mockResolvedValue([]),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  getCurrentStore: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'Main Store',
    address: '1 Main Street',
    phone: '+2348030000000',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    receipt_footer: 'Thank you for your custom',
    active: true,
    created_at: '2026-01-15T09:30:00.000Z',
    updated_at: '2026-01-15T09:30:00.000Z',
  }),
  updateCurrentStore: vi.fn(),
  getAuditActions: vi.fn().mockResolvedValue({ actions: [] }),
  getAudits: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
}));

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  listCategories: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 100, total: 0, total_pages: 0 },
  }),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deactivateItem: vi.fn(),
  reactivateItem: vi.fn(),
  changeItemPrice: vi.fn(),
  getItemUnits: vi.fn().mockResolvedValue({ units: [] }),
}));

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn().mockResolvedValue({ cash: { method: 'cash', accounts: [] } }),
  getSalesSummary: vi.fn(),
  getSalesOverview: vi.fn().mockResolvedValue({
    timezone: 'Africa/Lagos',
    scope: 'store',
    today: { date: '2026-11-14', total: 0, count: 0, by_method: [] },
    daily: [
      { date: '2026-11-08', total: 0, count: 0 },
      { date: '2026-11-09', total: 0, count: 0 },
      { date: '2026-11-10', total: 0, count: 0 },
      { date: '2026-11-11', total: 0, count: 0 },
      { date: '2026-11-12', total: 0, count: 0 },
      { date: '2026-11-13', total: 0, count: 0 },
      { date: '2026-11-14', total: 0, count: 0 },
    ],
  }),
  printSaleReceipt: vi.fn(),
}));

vi.mock('@/features/inventory/stock/services/stock.service', () => ({
  listStockMovements: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  getStockStatus: vi.fn(),
  listReconciliation: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  recordMovement: vi.fn(),
  initializeStock: vi.fn(),
  receiveStock: vi.fn(),
  adjustStock: vi.fn(),
  recordDamage: vi.fn(),
}));

vi.mock('@/features/shifts/services/shift.service', () => ({
  getCurrentShift: vi.fn().mockResolvedValue(null),
  getShifts: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  startShift: vi.fn(),
  endShift: vi.fn(),
}));

vi.mock('@/features/pos/service/pos.service', () => ({
  listPosAccounts: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, page_size: 25, total: 0, total_pages: 0 },
  }),
  getPosAccount: vi.fn(),
  createPosAccount: vi.fn(),
  updatePosAccount: vi.fn(),
  deactivatePosAccount: vi.fn(),
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

  it('redirects an authenticated visitor away from the sign-in screen', async () => {
    authenticate();
    renderAt('/');

    expect(
      await screen.findByRole(
        'heading',
        { name: /main store dashboard/i, level: 1 },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
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

  it('renders the dashboard inside the app shell', async () => {
    authenticate();
    renderAt('/dashboard');

    expect(
      await screen.findByRole('heading', { name: /main store dashboard/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Stocktake Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Sales today')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /theme/i })).not.toBeInTheDocument();
  });

  it('shows the grouped sidebar navigation', async () => {
    authenticate();
    renderAt('/dashboard');

    expect(await screen.findByText('General')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Sale' })).toBeInTheDocument();
  });

  it('reflects the active route in the sidebar', async () => {
    authenticate();
    renderAt('/sales/new');

    expect(await screen.findByRole('link', { name: 'New Sale' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['/sales/new', 'New Sale'],
    ['/inventory', 'Store Items'],
    ['/inventory/categories', 'Categories'],
    ['/inventory/movements', 'Stock Movements'],
    ['/admin/stock-reconciliation', 'Stock Reconciliation'],
    ['/sales', 'Sales History'],
    ['/shifts/summary', 'Shift Summary'],
    ['/admin/staff', 'Staff & Access'],
    ['/admin/payment-accounts', 'Payment Accounts'],
    ['/settings', 'Settings'],
    ['/admin/audits', 'Audit logs'],
  ])('renders the %s route', async (path, heading) => {
    authenticate();
    renderAt(path);

    expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
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
