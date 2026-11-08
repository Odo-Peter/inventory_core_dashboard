import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StockReconciliationPage } from '@/features/inventory/stock/pages/stock-reconciliation-page';
import { listReconciliation } from '@/features/inventory/stock/services/stock.service';
import {
  buildPageMeta,
  buildReconciliationRow,
  reconciliationFixtures,
} from '../../../helpers/stock';
import { RoleProvider } from '../../../helpers/role';

vi.mock('@/features/inventory/stock/services/stock.service', () => ({
  listStockMovements: vi.fn(),
  getStockStatus: vi.fn(),
  listReconciliation: vi.fn(),
  recordMovement: vi.fn(),
  initializeStock: vi.fn(),
  receiveStock: vi.fn(),
  adjustStock: vi.fn(),
  recordDamage: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPage(initialEntry = '/inventory/reconciliation') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const view = render(
    <RoleProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/inventory/reconciliation"
              element={
                <>
                  <StockReconciliationPage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );

  return { queryClient, ...view };
}

function search() {
  return screen.getByTestId('location-search').textContent ?? '';
}

describe('StockReconciliationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listReconciliation).mockResolvedValue({
      data: reconciliationFixtures,
      meta: buildPageMeta({ total: reconciliationFixtures.length }),
    });
  });

  it('renders mismatched items with cached, ledger, and difference values', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Stock Reconciliation', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Finds items whose stock count no longer matches the sum of their stock movements.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('2 items where cached stock differs from the ledger'),
    ).toBeInTheDocument();
    expect(listReconciliation).toHaveBeenCalledWith({ page: 1, page_size: 25 });

    const fantaRow = screen.getByText('Fanta Orange 50cl').closest('tr') as HTMLElement;
    expect(within(fantaRow).getByText('3')).toBeInTheDocument();
    expect(within(fantaRow).getByText('5')).toBeInTheDocument();
    expect(within(fantaRow).getByText('−2')).toBeInTheDocument();
    expect(within(fantaRow).getByRole('link', { name: 'View ledger' })).toHaveAttribute(
      'href',
      '/inventory/movements?item_id=item-2',
    );

    const waterRow = screen.getByText('Bottled Water 75cl').closest('tr') as HTMLElement;
    expect(within(waterRow).getByText('+5')).toBeInTheDocument();
  });

  it('uses the singular description for one drifted item', async () => {
    vi.mocked(listReconciliation).mockResolvedValue({
      data: [buildReconciliationRow({ difference: -1 })],
      meta: buildPageMeta({ total: 1 }),
    });
    renderPage();

    expect(
      await screen.findByText('1 item where cached stock differs from the ledger'),
    ).toBeInTheDocument();
  });

  it('shows the all-clear empty state while keeping headers', async () => {
    vi.mocked(listReconciliation).mockResolvedValue({
      data: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
    });
    renderPage();

    expect(await screen.findByText('Ledger and stock counts agree')).toBeInTheDocument();
    expect(
      screen.getByText('No items have drifted from their movement history.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Difference' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('re-runs the check from the Re-check button', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('2 items where cached stock differs from the ledger');
    const recheck = screen.getByRole('button', { name: 'Re-check' });
    await user.click(recheck);

    await waitFor(() => expect(listReconciliation).toHaveBeenCalledTimes(2));
    expect(recheck).not.toBeDisabled();
  });

  it('shows the error state and retries', async () => {
    vi.mocked(listReconciliation)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({
        data: reconciliationFixtures,
        meta: buildPageMeta({ total: reconciliationFixtures.length }),
      });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Failed to run the reconciliation check')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByText('2 items where cached stock differs from the ledger'),
    ).toBeInTheDocument();
    expect(listReconciliation).toHaveBeenCalledTimes(2);
  });

  it('steps back when the current page is beyond the last page', async () => {
    vi.mocked(listReconciliation).mockResolvedValue({
      data: reconciliationFixtures,
      meta: buildPageMeta({ page: 2, total: 10, total_pages: 2 }),
    });
    renderPage('/inventory/reconciliation?page=5');

    await waitFor(() => expect(search()).toBe('?page=2'));
    await waitFor(() => {
      expect(listReconciliation).toHaveBeenLastCalledWith({ page: 2, page_size: 25 });
    });
  });

  it('does not step back when there are no pages at all', async () => {
    vi.mocked(listReconciliation).mockResolvedValue({
      data: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
    });
    renderPage('/inventory/reconciliation?page=4');

    await screen.findByText('Ledger and stock counts agree');

    expect(search()).toBe('?page=4');
    expect(listReconciliation).toHaveBeenCalledWith({ page: 4, page_size: 25 });
  });

  it('clamps invalid page params to the first page', async () => {
    renderPage('/inventory/reconciliation?page=-2');

    await screen.findByText('2 items where cached stock differs from the ledger');

    expect(listReconciliation).toHaveBeenCalledWith({ page: 1, page_size: 25 });
  });

  it('paginates and drops the page param on the first page', async () => {
    const user = userEvent.setup();
    vi.mocked(listReconciliation).mockResolvedValue({
      data: reconciliationFixtures,
      meta: buildPageMeta({ page: 2, total: 50, total_pages: 3 }),
    });
    renderPage('/inventory/reconciliation?page=2');

    await screen.findByText('Page 2 of 3');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(search()).toBe('?page=3'));

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => expect(search()).toBe(''));
  });
});
