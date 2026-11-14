import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecentSales } from '@/features/dashboard/components/recent-sales';
import { listSales } from '@/features/sales/services/sales.service';
import type { SaleListItem } from '@/features/sales/types';
import type { Role } from '@/lib/rbac/roles';
import { makeSaleListItem, salesMeta } from '../../helpers/sales';
import { RoleProvider } from '../../helpers/role';

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSalesOverview: vi.fn(),
}));

function salesPage(data: SaleListItem[]) {
  return { data, meta: { ...salesMeta, total: data.length } };
}

function renderRecentSales(role: Role | null = 'admin') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <RoleProvider role={role}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RecentSales />
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );
}

describe('RecentSales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSales).mockResolvedValue(
      salesPage([
        makeSaleListItem({ total: 380_000 }),
        makeSaleListItem({
          id: 'sale-2',
          receipt_number: 1041,
          payment_method: 'card',
          total: 150_000,
        }),
      ]),
    );
  });

  it('loads the latest five sales', async () => {
    renderRecentSales();

    expect(await screen.findByText('#1042')).toBeInTheDocument();
    expect(listSales).toHaveBeenCalledWith({ page: 1, page_size: 5 });
  });

  it('shows the receipt, payment method, and naira total for each sale', async () => {
    renderRecentSales();

    const first = (await screen.findByText('#1042')).closest('li');
    expect(first).not.toBeNull();
    expect(within(first as HTMLElement).getByText(/Cash/)).toBeInTheDocument();
    expect(within(first as HTMLElement).getByText('₦3,800.00')).toBeInTheDocument();

    const second = screen.getByText('#1041').closest('li');
    expect(second).not.toBeNull();
    expect(within(second as HTMLElement).getByText(/Card/)).toBeInTheDocument();
    expect(within(second as HTMLElement).getByText('₦1,500.00')).toBeInTheDocument();
  });

  it('links each row to its sale in the history page', async () => {
    renderRecentSales();

    expect((await screen.findByText('#1042')).closest('a')).toHaveAttribute(
      'href',
      '/sales?sale_id=sale-1',
    );
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/sales');
  });

  it('falls back to an unknown payment method', async () => {
    vi.mocked(listSales).mockResolvedValue(salesPage([makeSaleListItem({ payment_method: null })]));

    renderRecentSales();

    expect(await screen.findByText(/Unknown/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no sales', async () => {
    vi.mocked(listSales).mockResolvedValue(salesPage([]));

    renderRecentSales();

    expect(await screen.findByText('No sales yet')).toBeInTheDocument();
  });

  it('shows an error with a retry action', async () => {
    const user = userEvent.setup();
    vi.mocked(listSales)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(salesPage([makeSaleListItem()]));

    renderRecentSales();

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load recent sales");

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('#1042')).toBeInTheDocument();
  });

  it('renders nothing for an unknown role', () => {
    renderRecentSales(null);

    expect(screen.queryByText('Recent sales')).not.toBeInTheDocument();
    expect(listSales).not.toHaveBeenCalled();
  });
});
