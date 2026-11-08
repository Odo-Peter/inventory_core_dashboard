import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SalesHistoryPage } from '@/features/sales/pages/sales-history-page';
import { getSale, listSales, printSaleReceipt } from '@/features/sales/services/sales.service';
import { formatNaira } from '@/features/admin/staff/utils';
import { resolveRange } from '@/features/inventory/stock/lib/movement-utils';
import { makeReceipt, makeSale, makeSaleListItem, saleListFixtures } from '../../helpers/sales';
import { RoleProvider } from '../../helpers/role';

process.env.TZ = 'UTC';

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPage(initialEntry = '/sales') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <RoleProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/sales"
              element={
                <>
                  <SalesHistoryPage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );
}

function search() {
  return screen.getByTestId('location-search').textContent ?? '';
}

function meta(
  overrides: Partial<{ page: number; page_size: number; total: number; total_pages: number }> = {},
) {
  return { page: 1, page_size: 25, total: 2, total_pages: 1, ...overrides };
}

describe('SalesHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSales).mockResolvedValue({ data: saleListFixtures, meta: meta() });
    vi.mocked(getSale).mockResolvedValue(makeSale());
    vi.mocked(printSaleReceipt).mockResolvedValue(makeReceipt({ is_copy: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the first page and renders the sales ledger', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Sales History' })).toBeInTheDocument();
    expect(await screen.findByText('2 sales')).toBeInTheDocument();
    expect(listSales).toHaveBeenCalledWith({ page: 1, page_size: 25 });

    const row = screen.getByText('#1042').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('2 items')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('Cash')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText(formatNaira(3800))).toBeInTheDocument();

    expect(screen.getByText('#1041')).toBeInTheDocument();
    expect(screen.getByText('Bola Adeyemi')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('does not offer edit or delete controls for immutable sales', async () => {
    renderPage();

    await screen.findByText('2 sales');
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('reads filters and the page from the URL', async () => {
    renderPage('/sales?q=1042&from=2026-10-01&to=2026-10-07&payment_method=card&page=2');

    await screen.findByText('2 sales matching filters');

    const { from, to } = resolveRange('2026-10-01', '2026-10-07');
    expect(listSales).toHaveBeenCalledWith({
      page: 2,
      page_size: 25,
      q: '1042',
      payment_method: 'card',
      from,
      to,
    });

    expect(screen.getByLabelText('Receipt number')).toHaveValue('1042');
    expect(screen.getByLabelText('Date range')).toHaveTextContent('Oct 1, 2026 to Oct 7, 2026');
    expect(screen.getByRole('combobox', { name: 'Payment method' })).toHaveTextContent('Card');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('clamps an out-of-range page back to the last page', async () => {
    vi.mocked(listSales).mockImplementation(async (query) => ({
      data: saleListFixtures,
      meta: meta({ page: query?.page ?? 1, total: 30, total_pages: 2 }),
    }));
    renderPage('/sales?page=99');

    await waitFor(() => expect(search()).toContain('page=2'));
    await waitFor(() => expect(listSales).toHaveBeenLastCalledWith({ page: 2, page_size: 25 }));
  });

  it('debounces the receipt number and returns to page one', async () => {
    const user = userEvent.setup();
    renderPage('/sales?page=2');

    await screen.findByText('2 sales');
    await user.type(screen.getByLabelText('Receipt number'), '1042');

    await waitFor(() => expect(search()).toContain('q=1042'), { timeout: 1500 });
    expect(search()).not.toContain('page=');
    await waitFor(() =>
      expect(listSales).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 25,
        q: '1042',
      }),
    );
  });

  it('filters by payment method and resets it', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('2 sales');
    await user.click(screen.getByRole('combobox', { name: 'Payment method' }));
    await user.click(await screen.findByRole('option', { name: 'Bank transfer' }));

    await waitFor(() => expect(search()).toContain('payment_method=bank_transfer'));
    await waitFor(() =>
      expect(listSales).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 25,
        payment_method: 'bank_transfer',
      }),
    );

    await user.click(screen.getByRole('combobox', { name: 'Payment method' }));
    await user.click(await screen.findByRole('option', { name: 'All methods' }));

    await waitFor(() => expect(search()).toBe(''));
    await waitFor(() => expect(listSales).toHaveBeenLastCalledWith({ page: 1, page_size: 25 }));
  });

  it('applies a date range preset', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await screen.findByText('2 sales');
    await user.click(screen.getByLabelText('Date range'));
    await user.click(await screen.findByRole('button', { name: '7 days' }));

    await waitFor(() => expect(search()).toContain('from=2026-11-01'));
    expect(search()).toContain('to=2026-11-07');

    const { from, to } = resolveRange('2026-11-01', '2026-11-07');
    await waitFor(() =>
      expect(listSales).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 25,
        from,
        to,
      }),
    );
  });

  it('clears every filter', async () => {
    const user = userEvent.setup();
    renderPage('/sales?q=1042&payment_method=card&page=2');

    await screen.findByText('2 sales matching filters');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(search()).toBe(''));
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    await waitFor(() => expect(listSales).toHaveBeenLastCalledWith({ page: 1, page_size: 25 }));
  });

  it('paginates forwards and backwards', async () => {
    const user = userEvent.setup();
    vi.mocked(listSales).mockImplementation(async (query) => ({
      data: saleListFixtures,
      meta: meta({ page: query?.page ?? 1, total: 60, total_pages: 3 }),
    }));
    renderPage();

    await screen.findByText('Page 1 of 3');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(search()).toBe('?page=2'));
    await screen.findByText('Page 2 of 3');
    expect(listSales).toHaveBeenLastCalledWith({ page: 2, page_size: 25 });

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    await waitFor(() => expect(search()).toBe(''));
    await screen.findByText('Page 1 of 3');
    expect(listSales).toHaveBeenLastCalledWith({ page: 1, page_size: 25 });
  });

  it('opens the sale details drawer from a row', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('2 sales');
    await user.click(screen.getByText('#1042'));

    const drawer = await screen.findByRole('dialog', { name: 'Sale details' });
    expect(getSale).toHaveBeenCalledWith('sale-1');
    expect(within(drawer).getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(within(drawer).getByTestId('sale-total')).toHaveTextContent(formatNaira(3800));
  });

  it('shows the filter-specific empty state', async () => {
    const user = userEvent.setup();
    vi.mocked(listSales).mockResolvedValue({
      data: [],
      meta: meta({ total: 0, total_pages: 0 }),
    });
    renderPage('/sales?q=999');

    expect(await screen.findByText('No sales match these filters')).toBeInTheDocument();

    const clearButtons = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clearButtons.length).toBeGreaterThan(0);
    await user.click(clearButtons[clearButtons.length - 1]);

    await waitFor(() => expect(search()).toBe(''));
    expect(await screen.findByText('No sales yet')).toBeInTheDocument();
  });

  it('shows the default empty state without filters', async () => {
    vi.mocked(listSales).mockResolvedValue({
      data: [],
      meta: meta({ total: 0, total_pages: 0 }),
    });
    renderPage();

    expect(await screen.findByText('No sales yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('shows an error state and retries', async () => {
    const user = userEvent.setup();
    vi.mocked(listSales)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ data: saleListFixtures, meta: meta() });
    renderPage();

    expect(await screen.findByText('Failed to load sales')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('#1042')).toBeInTheDocument();
    expect(listSales).toHaveBeenCalledTimes(2);
  });

  it('keeps the table data while a page is loading', async () => {
    const user = userEvent.setup();
    vi.mocked(listSales)
      .mockResolvedValueOnce({ data: saleListFixtures, meta: meta({ total: 60, total_pages: 3 }) })
      .mockImplementationOnce(() => new Promise(() => {}));
    renderPage();

    await screen.findByText('#1042');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(search()).toBe('?page=2'));
    // placeholderData keeps the previous page rows visible while fetching.
    expect(screen.getByText('#1042')).toBeInTheDocument();
  });

  it('renders a single-item row with the singular label', async () => {
    vi.mocked(listSales).mockResolvedValue({
      data: [makeSaleListItem({ receipt_number: 2000, item_count: 1, payment_method: 'cash' })],
      meta: meta({ total: 1, total_pages: 1 }),
    });
    renderPage();

    const row = (await screen.findByText('#2000')).closest('tr');
    expect(within(row as HTMLElement).getByText('1 item')).toBeInTheDocument();
  });
});
