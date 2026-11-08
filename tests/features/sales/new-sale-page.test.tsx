import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-error';
import { NewSalePage } from '@/features/sales/pages/new-sale-page';
import {
  getItemByBarcode,
  listCategories,
  listItems,
} from '@/features/inventory/category/services/category.service';
import {
  createSale,
  getPaymentOptions,
  printSaleReceipt,
} from '@/features/sales/services/sales.service';
import { myProfile } from '@/features/auth/services/auth.service';
import { formatNaira } from '@/features/admin/staff/utils';
import type { MyProfile } from '@/features/auth/interface';
import { categoryFixtures, itemMeta, listItemsResponse, makeItem } from '../../helpers/items';
import { makePaymentOptions, makeReceipt, makeSale } from '../../helpers/sales';
import { RoleProvider } from '../../helpers/role';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
  getItemByBarcode: vi.fn(),
  uploadItemImage: vi.fn(),
  removeItemImage: vi.fn(),
}));

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
  changePin: vi.fn(),
  myProfile: vi.fn(),
}));

const profile: MyProfile = {
  id: 'staff-1',
  name: 'Ada Okafor',
  first_name: 'Ada',
  last_name: 'Okafor',
  role: 'cashier',
  store_id: 'store-1',
  must_change_pin: false,
  active_shift_id: 'shift-1',
  staff_code: 'CASHIER001',
  store_name: 'Test Store',
};

const products = [
  makeItem({
    id: 'item-1',
    name: 'Coca-Cola 50cl',
    current_price: 1500,
    stock_quantity: 24,
    reorder_threshold: 5,
  }),
  makeItem({
    id: 'item-2',
    name: 'Bottled Water 75cl',
    current_price: 800,
    stock_quantity: 40,
    reorder_threshold: 10,
    unit: 'pack',
  }),
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPage(initialEntry = '/sales/new') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <RoleProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/sales/new"
              element={
                <>
                  <NewSalePage />
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

async function addCocaColaToCart(user: ReturnType<typeof userEvent.setup>, quantity = 1) {
  await user.click(await screen.findByRole('button', { name: /Coca-Cola 50cl/ }));
  const drawer = await screen.findByRole('dialog', { name: 'Add to cart' });
  for (let i = 1; i < quantity; i += 1) {
    await user.click(within(drawer).getByRole('button', { name: 'Increase quantity' }));
  }
  await user.click(within(drawer).getByRole('button', { name: 'Add to cart' }));
}

async function completeSale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Checkout' }));
  const drawer = await screen.findByRole('dialog', { name: 'Checkout' });
  await waitFor(() =>
    expect(within(drawer).getByRole('combobox', { name: 'Payment method' })).not.toBeDisabled(),
  );
  await user.click(within(drawer).getByRole('button', { name: 'Complete sale' }));
}

describe('NewSalePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listItems).mockResolvedValue(
      listItemsResponse(products, { ...itemMeta, page_size: 40, total: products.length }),
    );
    vi.mocked(listCategories).mockResolvedValue({
      data: categoryFixtures,
      meta: { page: 1, page_size: 100, total: categoryFixtures.length, total_pages: 1 },
    });
    vi.mocked(myProfile).mockResolvedValue(profile);
    vi.mocked(getItemByBarcode).mockResolvedValue(products[0]);
    vi.mocked(getPaymentOptions).mockResolvedValue(makePaymentOptions());
    vi.mocked(createSale).mockResolvedValue(makeSale());
    vi.mocked(printSaleReceipt).mockResolvedValue(makeReceipt());
  });

  it('loads products and categories with the default query', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'New Sale' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Coca-Cola 50cl/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bottled Water 75cl/ })).toBeInTheDocument();
    expect(screen.getByTestId('product-count')).toHaveTextContent('Showing 2 of 2 items');

    expect(await screen.findByRole('button', { name: 'Beverages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

    expect(listItems).toHaveBeenCalledWith({ page: 1, page_size: 40, active: true });
    expect(listCategories).toHaveBeenCalledWith({ page: 1, page_size: 100, active: true });
  });

  it('reads the search and category from the URL', async () => {
    renderPage('/sales/new?q=cola&category_id=category-1');

    expect(screen.getByLabelText('Search products or scan a barcode')).toHaveValue('cola');
    expect(await screen.findByRole('button', { name: 'Beverages' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');

    await waitFor(() =>
      expect(listItems).toHaveBeenCalledWith({
        page: 1,
        page_size: 40,
        active: true,
        q: 'cola',
        category_id: 'category-1',
      }),
    );
  });

  it('debounces typed search into the URL', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('button', { name: /Coca-Cola 50cl/ });
    await user.type(screen.getByLabelText('Search products or scan a barcode'), 'water');

    await waitFor(() => expect(search()).toContain('q=water'), { timeout: 1500 });
    await waitFor(() =>
      expect(listItems).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 40,
        active: true,
        q: 'water',
      }),
    );
  });

  it('filters by category and returns to all products', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Beverages' }));

    await waitFor(() => expect(search()).toContain('category_id=category-1'));
    expect(screen.getByRole('button', { name: 'Beverages' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() =>
      expect(listItems).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 40,
        active: true,
        category_id: 'category-1',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => expect(search()).toBe(''));
    await waitFor(() =>
      expect(listItems).toHaveBeenLastCalledWith({ page: 1, page_size: 40, active: true }),
    );
  });

  it('adds a product to the cart and summarises it', async () => {
    const user = userEvent.setup();
    renderPage();

    await addCocaColaToCart(user, 2);

    expect(toast.success).toHaveBeenCalledWith('Coca-Cola 50cl added to cart');
    const cart = await screen.findByRole('region', { name: 'Cart' });
    expect(cart).toHaveTextContent('2 items');
    expect(cart).toHaveTextContent(formatNaira(3000));
  });

  it('records a sale, refreshes products, and shows the receipt', async () => {
    const user = userEvent.setup();
    renderPage();

    await addCocaColaToCart(user, 2);
    await completeSale(user);

    await waitFor(() => expect(createSale).toHaveBeenCalled());
    expect(vi.mocked(createSale).mock.calls[0][0]).toMatchObject({
      items: [{ item_id: 'item-1', quantity: 2 }],
      payment_method: 'cash',
      expected_total: 3000,
      idempotency_key: expect.any(String),
    });

    expect(await screen.findByRole('dialog', { name: 'Receipt' })).toBeInTheDocument();
    expect(printSaleReceipt).toHaveBeenCalledWith('sale-1');
    expect(screen.queryByRole('region', { name: 'Cart' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New sale' }));
    expect(screen.queryByRole('dialog', { name: 'Receipt' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Search products or scan a barcode')).toHaveValue('');
  });

  it('warns but keeps the sale when the receipt cannot be prepared', async () => {
    const user = userEvent.setup();
    vi.mocked(printSaleReceipt).mockRejectedValue(new Error('printer offline'));
    renderPage();

    await addCocaColaToCart(user, 1);
    await completeSale(user);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Sale recorded, but the receipt could not be prepared.',
      ),
    );
    expect(screen.queryByRole('dialog', { name: 'Receipt' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Cart' })).not.toBeInTheDocument();
  });

  it('blocks checkout when the cashier has not clocked in', async () => {
    const user = userEvent.setup();
    vi.mocked(myProfile).mockResolvedValue({ ...profile, active_shift_id: null });
    renderPage();

    expect(await screen.findByText('Clock in to start selling')).toBeInTheDocument();

    await addCocaColaToCart(user, 1);

    expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
  });

  it('shows no shift banner when the cashier is clocked in', async () => {
    renderPage();

    await screen.findByRole('button', { name: /Coca-Cola 50cl/ });
    expect(screen.queryByText('Clock in to start selling')).not.toBeInTheDocument();
  });

  it('opens the quantity drawer when a barcode is scanned', async () => {
    const user = userEvent.setup();
    renderPage();

    const searchInput = screen.getByLabelText('Search products or scan a barcode');
    await user.type(searchInput, '1234567890');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(getItemByBarcode).toHaveBeenCalledWith('1234567890'));
    expect(await screen.findByRole('dialog', { name: 'Add to cart' })).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('refuses to sell an out-of-stock barcode scan', async () => {
    const user = userEvent.setup();
    vi.mocked(getItemByBarcode).mockResolvedValue(makeItem({ stock_quantity: 0 }));
    renderPage();

    const searchInput = screen.getByLabelText('Search products or scan a barcode');
    await user.type(searchInput, '1234567890');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('That item is out of stock.'));
    expect(screen.queryByRole('dialog', { name: 'Add to cart' })).not.toBeInTheDocument();
  });

  it('refuses to sell an inactive barcode scan', async () => {
    const user = userEvent.setup();
    vi.mocked(getItemByBarcode).mockResolvedValue(makeItem({ active: false }));
    renderPage();

    const searchInput = screen.getByLabelText('Search products or scan a barcode');
    await user.type(searchInput, '1234567890');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('That item is inactive and cannot be sold.'),
    );
    expect(screen.queryByRole('dialog', { name: 'Add to cart' })).not.toBeInTheDocument();
  });

  it('falls back to a text search when the barcode is not found', async () => {
    const user = userEvent.setup();
    vi.mocked(getItemByBarcode).mockRejectedValue(
      new ApiError('not found', { code: 'item_not_found' }),
    );
    renderPage();

    const searchInput = screen.getByLabelText('Search products or scan a barcode');
    await user.type(searchInput, '1234567890');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(search()).toContain('q=1234567890'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows an error state and retries loading products', async () => {
    const user = userEvent.setup();
    vi.mocked(listItems)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(
        listItemsResponse(products, { ...itemMeta, page_size: 40, total: products.length }),
      );
    renderPage();

    expect(await screen.findByText('Failed to load products')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: /Coca-Cola 50cl/ })).toBeInTheDocument();
    expect(listItems).toHaveBeenCalledTimes(2);
  });

  it('clears search and category from an empty result', async () => {
    const user = userEvent.setup();
    vi.mocked(listItems).mockResolvedValue(
      listItemsResponse([], { ...itemMeta, page_size: 40, total: 0, total_pages: 0 }),
    );
    renderPage('/sales/new?q=cola&category_id=category-1');

    expect(await screen.findByText('No products found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(search()).toBe(''));
    expect(screen.getByLabelText('Search products or scan a barcode')).toHaveValue('');
  });
});
