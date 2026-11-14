import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { listItems } from '@/features/inventory/category/services/category.service';
import { getSalesOverview } from '@/features/sales/services/sales.service';
import type { Role } from '@/lib/rbac/roles';
import { makeSalesOverview } from '../../helpers/dashboard';
import { listItemsResponse } from '../../helpers/items';
import { RoleProvider } from '../../helpers/role';

vi.mock('@/features/sales/services/sales.service', () => ({
  getSalesOverview: vi.fn(),
}));

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn(),
  listCategories: vi.fn(),
  getItemUnits: vi.fn(),
  listItemPriceHistory: vi.fn(),
}));

function renderCards(role: Role | null = 'admin') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <RoleProvider role={role}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MetricCards />
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );
}

describe('MetricCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSalesOverview).mockResolvedValue(makeSalesOverview());
    vi.mocked(listItems).mockResolvedValue(
      listItemsResponse([], {
        page: 1,
        page_size: 1,
        total: 3,
        total_pages: 3,
      }),
    );
  });

  it('renders today, transactions, average sale, and low stock from the API', async () => {
    renderCards();

    expect(await screen.findByText('₦1,500.00')).toBeInTheDocument();
    expect(screen.getByText('Sales today')).toBeInTheDocument();
    expect(screen.getByText('7-day average ₦1,000.00')).toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Cash 1 · Card 1')).toBeInTheDocument();

    expect(screen.getByText('Average sale')).toBeInTheDocument();
    expect(screen.getByText('₦750.00')).toBeInTheDocument();
    expect(screen.getByText('Across 2 transactions')).toBeInTheDocument();

    expect(screen.getByText('Low stock items')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('At or below reorder threshold')).toBeInTheDocument();
  });

  it('only requests the first low stock item', async () => {
    renderCards();

    await screen.findByText('Low stock items');
    expect(listItems).toHaveBeenCalledWith({ page: 1, page_size: 1, low_stock: true });
  });

  it('links the low stock card to the filtered inventory page', async () => {
    renderCards();

    expect(await screen.findByRole('link', { name: 'View low stock items' })).toHaveAttribute(
      'href',
      '/inventory?low_stock=true',
    );
  });

  it('uses the own-sales label for a cashier', async () => {
    vi.mocked(getSalesOverview).mockResolvedValue(makeSalesOverview({ scope: 'own' }));

    renderCards('cashier');

    expect(await screen.findByText('Your sales today')).toBeInTheDocument();
    expect(screen.queryByText('Sales today')).not.toBeInTheDocument();
  });

  it('uses the store label for a manager', async () => {
    renderCards('manager');

    expect(await screen.findByText('Sales today')).toBeInTheDocument();
    expect(screen.queryByText('Your sales today')).not.toBeInTheDocument();
  });

  it('renders nothing for an unknown role', () => {
    renderCards(null);

    expect(screen.queryByRole('region', { name: "Today's overview" })).not.toBeInTheDocument();
    expect(getSalesOverview).not.toHaveBeenCalled();
    expect(listItems).not.toHaveBeenCalled();
  });

  it('shows an inline error and retries the overview', async () => {
    const user = userEvent.setup();
    vi.mocked(getSalesOverview)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(makeSalesOverview());

    renderCards();

    expect(await screen.findAllByText("Couldn't load this metric.")).toHaveLength(3);

    await user.click(screen.getAllByRole('button', { name: 'Retry' })[0]);

    await waitFor(() => expect(getSalesOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('₦1,500.00')).toBeInTheDocument();
  });

  it('keeps sales cards usable when the low stock lookup fails', async () => {
    vi.mocked(listItems).mockRejectedValue(new Error('network'));

    renderCards();

    expect(await screen.findByText('₦1,500.00')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load this metric.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows n/a when there are no sales today', async () => {
    vi.mocked(getSalesOverview).mockResolvedValue(
      makeSalesOverview({
        today: { date: '2026-11-14', total: 0, count: 0, by_method: [] },
      }),
    );

    renderCards();

    expect(await screen.findByText('n/a')).toBeInTheDocument();
    expect(screen.getByText('No sales today')).toBeInTheDocument();
    expect(screen.getByText('No payments recorded today')).toBeInTheDocument();
  });
});
