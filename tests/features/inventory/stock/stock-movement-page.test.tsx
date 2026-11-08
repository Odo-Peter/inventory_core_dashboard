import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StockMovementPage } from '@/features/inventory/stock/pages/stock-movement';
import {
  getStockStatus,
  listStockMovements,
  recordMovement,
} from '@/features/inventory/stock/services/stock.service';
import { listItems } from '@/features/inventory/category/services/category.service';
import {
  buildMovement,
  buildPageMeta,
  buildStockStatus,
  movementFixtures,
} from '../../../helpers/stock';
import { listItemsResponse } from '../../../helpers/items';
import { resolveRange } from '@/features/inventory/stock/lib/movement-utils';
import { RoleProvider } from '../../../helpers/role';

process.env.TZ = 'UTC';

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

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn(),
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deactivateItem: vi.fn(),
  reactivateItem: vi.fn(),
  changeItemPrice: vi.fn(),
  getItemUnits: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPage(initialEntry = '/inventory/movements') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const view = render(
    <RoleProvider role="admin">
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/inventory/movements"
              element={
                <>
                  <StockMovementPage />
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

describe('StockMovementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listStockMovements).mockResolvedValue({
      data: movementFixtures,
      meta: buildPageMeta({ total: movementFixtures.length }),
    });
    vi.mocked(listItems).mockResolvedValue(listItemsResponse());
    vi.mocked(getStockStatus).mockResolvedValue(buildStockStatus());
    vi.mocked(recordMovement).mockResolvedValue(buildMovement());
  });

  it('loads the first page with no filters and renders the ledger', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Stock Movements' })).toBeInTheDocument();
    expect(await screen.findByText('4 movements')).toBeInTheDocument();

    expect(screen.getAllByText('Coca-Cola 50cl').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fanta Orange 50cl').length).toBeGreaterThan(0);

    expect(listStockMovements).toHaveBeenCalledWith({ page: 1, page_size: 25 });
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('reads q, reasons, dates, item, and page from the URL', async () => {
    renderPage(
      '/inventory/movements?q=cola&reason=sale,damage,junk&from=2026-10-01&to=2026-10-07&item_id=item-1&page=2',
    );

    await screen.findByText('4 movements matching filters');

    const { from, to } = resolveRange('2026-10-01', '2026-10-07');
    expect(listStockMovements).toHaveBeenCalledWith({
      page: 2,
      page_size: 25,
      search: 'cola',
      reason: ['sale', 'damage'],
      item_id: 'item-1',
      from,
      to,
    });

    expect(screen.getByLabelText('Search')).toHaveValue('cola');
    expect(screen.getByRole('button', { name: 'Sale' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Damage' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Restock' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByLabelText('Date range')).toHaveTextContent('Oct 1, 2026 to Oct 7, 2026');
    expect(await screen.findByRole('button', { name: /Item: Coca-Cola 50cl/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it.each(['?page=0', '?page=-3', '?page=abc'])('clamps %s to the first page', async (query) => {
    renderPage(`/inventory/movements${query}`);

    await screen.findByText('4 movements');

    expect(listStockMovements).toHaveBeenCalledWith({ page: 1, page_size: 25 });
  });

  it('debounces search into the URL and drops the page param', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/movements?page=2');

    await screen.findByText('4 movements');

    await user.type(screen.getByLabelText('Search'), 'cola');

    await waitFor(
      () => {
        expect(search()).toContain('q=cola');
      },
      { timeout: 1500 },
    );
    expect(search()).not.toContain('page=');
    await waitFor(() => {
      expect(listStockMovements).toHaveBeenCalledWith({
        page: 1,
        page_size: 25,
        search: 'cola',
      });
    });
  });

  it('toggles a reason chip in the URL and returns to page one', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/movements?page=3');

    await screen.findByText('4 movements');

    await user.click(screen.getByRole('button', { name: 'Sale' }));

    await waitFor(() => expect(search()).toContain('reason=sale'));
    expect(search()).not.toContain('page=');
    await waitFor(() => {
      expect(listStockMovements).toHaveBeenCalledWith({
        page: 1,
        page_size: 25,
        reason: ['sale'],
      });
    });
  });

  it('resets every filter and hides the filter-specific empty actions', async () => {
    const user = userEvent.setup();
    vi.mocked(listStockMovements).mockResolvedValue({
      data: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
    });
    renderPage('/inventory/movements?q=cola&reason=sale');

    expect(await screen.findByText('No movements match these filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(search()).toBe(''));
    expect(await screen.findByText('No stock movements yet')).toBeInTheDocument();
    expect(screen.queryByText('No movements match these filters')).not.toBeInTheDocument();
    expect(listStockMovements).toHaveBeenLastCalledWith({ page: 1, page_size: 25 });
  });

  it('clears filters from the empty state', async () => {
    const user = userEvent.setup();
    vi.mocked(listStockMovements).mockResolvedValue({
      data: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
    });
    renderPage('/inventory/movements?item_id=item-1');

    expect(await screen.findByText('No movements match these filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(search()).toBe(''));
  });

  it('paginates and removes the page param when returning to the first page', async () => {
    const user = userEvent.setup();
    vi.mocked(listStockMovements).mockImplementation(async (query) => ({
      data: movementFixtures,
      meta: buildPageMeta({ page: query.page, total: 60, total_pages: 3 }),
    }));
    renderPage();

    await screen.findByText('Page 1 of 3');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(search()).toBe('?page=2'));
    await screen.findByText('Page 2 of 3');
    expect(listStockMovements).toHaveBeenLastCalledWith({ page: 2, page_size: 25 });

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    await waitFor(() => expect(search()).toBe(''));
    await screen.findByText('Page 1 of 3');
    expect(listStockMovements).toHaveBeenLastCalledWith({ page: 1, page_size: 25 });
  });

  it('filters the ledger to an item from its row', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/movements?page=2');

    await screen.findByText('4 movements');
    await user.click(screen.getByRole('button', { name: /Fanta Orange 50cl/ }));

    await waitFor(() => expect(search()).toBe('?item_id=item-2'));
    await waitFor(() => {
      expect(listStockMovements).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 25,
        item_id: 'item-2',
      });
    });
    expect(
      await screen.findByRole('button', { name: /Item: Fanta Orange 50cl/ }),
    ).toBeInTheDocument();
  });

  it('removes the item chip and returns to the default query', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/movements?item_id=item-1');

    const chip = await screen.findByRole('button', { name: /Item: Coca-Cola 50cl/ });
    await user.click(chip);

    await waitFor(() => expect(search()).toBe(''));
    await waitFor(() => {
      expect(listStockMovements).toHaveBeenLastCalledWith({ page: 1, page_size: 25 });
    });
  });

  it('shows the error state and retries', async () => {
    vi.mocked(listStockMovements)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({
        data: movementFixtures,
        meta: buildPageMeta({ total: movementFixtures.length }),
      });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Failed to load movements')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('4 movements')).toBeInTheDocument();
    expect(listStockMovements).toHaveBeenCalledTimes(2);
  });

  it('opens the record movement drawer without touching the URL', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('4 movements');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    const drawer = await screen.findByRole('dialog', { name: 'Record stock movement' });
    expect(
      within(drawer).getByText('Every change is added to the ledger and cannot be edited later.'),
    ).toBeInTheDocument();
    expect(search()).toBe('');
  });
});
