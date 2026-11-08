import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ItemPage } from '@/features/inventory/items/pages/item-page';
import {
  changeItemPrice,
  createItem,
  deactivateItem,
  getItemUnits,
  listCategories,
  listItems,
  reactivateItem,
  updateItem,
} from '@/features/inventory/category/services/category.service';
import { recordMovement } from '@/features/inventory/stock/services/stock.service';
import { getStockStatus } from '@/features/inventory/stock/services/stock.service';
import { formatNaira } from '@/features/admin/staff/utils';
import {
  categoryFixtures,
  expectedItemQuery,
  itemFixtures,
  itemMeta,
  listItemsResponse,
  makeItem,
  openItemRowActions,
} from '../../helpers/items';
import { buildStockStatus } from '../../helpers/stock';
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
}));

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

function renderPage(initialEntry = '/inventory') {
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
            <Route path="/inventory" element={<ItemPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );

  return { queryClient, ...view };
}

async function openDeactivateDialog(user: ReturnType<typeof userEvent.setup>) {
  const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
  await user.click(within(menu).getByRole('menuitem', { name: 'Deactivate item' }));
  return screen.findByRole('dialog', { name: 'Deactivate item' });
}

describe('ItemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listItems).mockResolvedValue(listItemsResponse());
    vi.mocked(listCategories).mockResolvedValue({ data: categoryFixtures, meta: itemMeta });
    vi.mocked(getItemUnits).mockResolvedValue({ units: ['bottle', 'pack', 'carton'] });
    vi.mocked(getStockStatus).mockResolvedValue(buildStockStatus());
  });

  it('renders the page header, filters, item rows, and summary', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Store Items', level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Manage your store's inventory, prices, and stock levels."),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add New Item' })).toBeInTheDocument();

    expect(await screen.findByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(screen.getByText('Fanta Orange 50cl')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();

    const colaRow = screen.getByText('Coca-Cola 50cl').closest('tr');
    expect(colaRow).not.toBeNull();
    expect(within(colaRow as HTMLElement).getByText('Beverages')).toBeInTheDocument();

    const fantaRow = screen.getByText('Fanta Orange 50cl').closest('tr');
    expect(fantaRow).not.toBeNull();
    expect(within(fantaRow as HTMLElement).getByText('Low stock')).toBeInTheDocument();
    expect(within(fantaRow as HTMLElement).getByText('Inactive')).toBeInTheDocument();

    expect(listItems).toHaveBeenCalledWith(expectedItemQuery());
    expect(listCategories).toHaveBeenCalledWith({ page: 1, page_size: 100 });
    expect(getItemUnits).toHaveBeenCalledTimes(1);
  });

  it('shows loading skeletons while items are being fetched', async () => {
    vi.mocked(listItems).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Store Items', level: 1 }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('Coca-Cola 50cl')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no items', async () => {
    vi.mocked(listItems).mockResolvedValue(
      listItemsResponse([], { ...itemMeta, total: 0, total_pages: 0 }),
    );
    renderPage();

    expect(await screen.findByText('No items found.')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
  });

  it('applies filters from the URL, including the filtered empty state', async () => {
    vi.mocked(listItems).mockResolvedValue(
      listItemsResponse([], { ...itemMeta, total: 0, total_pages: 0 }),
    );
    renderPage('/inventory?q=cola&active=false&category_id=category-1&low_stock=true&page=2');

    await waitFor(() => {
      expect(listItems).toHaveBeenCalledWith({
        page: 2,
        page_size: 25,
        q: 'cola',
        active: false,
        category_id: 'category-1',
        low_stock: true,
      });
    });
    expect(await screen.findByText('No items match these filters.')).toBeInTheDocument();
    expect(screen.getByText('0 items matching filters')).toBeInTheDocument();
  });

  it('clears URL filters and resets to the first page', async () => {
    const user = userEvent.setup();
    renderPage('/inventory?q=cola&active=false&category_id=category-1&low_stock=true&page=2');

    await screen.findByText('Coca-Cola 50cl');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(listItems).toHaveBeenLastCalledWith(expectedItemQuery());
    });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('corrects an out-of-range page back to the last available page', async () => {
    renderPage('/inventory?page=5');

    await waitFor(() => {
      expect(listItems).toHaveBeenCalledWith(expectedItemQuery({ page: 5 }));
      expect(listItems).toHaveBeenLastCalledWith(expectedItemQuery({ page: 1 }));
    });
  });

  it('shows an error state and retries the items request', async () => {
    const user = userEvent.setup();
    vi.mocked(listItems)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(listItemsResponse());

    renderPage();

    expect(await screen.findByText('Failed to load items')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(listItems).toHaveBeenCalledTimes(2);
  });

  it('handles a response with missing metadata and data', async () => {
    vi.mocked(listItems).mockResolvedValue({
      data: [makeItem({ name: 'Solo Item', category_id: null })],
    } as never);
    renderPage();

    expect(await screen.findByText('Solo Item')).toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('opens the item details drawer from a row click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Coca-Cola 50cl'));

    const dialog = await screen.findByRole('dialog', { name: 'Item details' });
    expect(within(dialog).getByText('SKU-001')).toBeInTheDocument();
    expect(within(dialog).getByText('1234567890')).toBeInTheDocument();
    expect(within(dialog).getByText(formatNaira(1500))).toBeInTheDocument();
    expect(within(dialog).getByText('24 bottle(s)')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getByText('Beverages')).toBeInTheDocument();
    });
  });

  it('creates an item from the add drawer and refreshes the listing', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[1]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    await user.click(screen.getByRole('button', { name: 'Add New Item' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add item' });
    await user.type(within(dialog).getByLabelText('Item name'), 'Sprite 50cl');
    await user.type(within(dialog).getByLabelText('Selling price'), '1100');
    // The filter bar and the form share the `item-category` id, so the form select
    // is not reliably labelled by its Category field. It is the first select in the form.
    await user.click(within(dialog).getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: 'Beverages' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sprite 50cl',
          category_id: 'category-1',
          current_price: 110000,
          active: true,
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Item "Sprite 50cl" created successfully');
    await waitFor(() => expect(vi.mocked(listItems).mock.calls.length).toBeGreaterThan(1));
  });

  it('edits an item from the row action menu', async () => {
    vi.mocked(updateItem).mockResolvedValue(makeItem({ name: 'Coca-Cola Zero' }));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit details' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit item' });
    expect(within(dialog).getByLabelText('Item name')).toHaveValue('Coca-Cola 50cl');
    await user.clear(within(dialog).getByLabelText('Item name'));
    await user.type(within(dialog).getByLabelText('Item name'), 'Coca-Cola Zero');
    await user.click(within(dialog).getByRole('button', { name: 'Update Item' }));

    await waitFor(async () => {
      await waitFor(() => {
        expect(updateItem).toHaveBeenCalledWith('item-1', { name: 'Coca-Cola Zero' });
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Item "Coca-Cola 50cl" updated successfully');
  });

  it('deactivates an item after typed confirmation and shows a success toast', async () => {
    vi.mocked(deactivateItem).mockResolvedValue(makeItem({ active: false }));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const dialog = await openDeactivateDialog(user);

    expect(within(dialog).getByText(/This will deactivate/)).toBeInTheDocument();
    const confirmButton = within(dialog).getByRole('button', { name: 'Deactivate' });
    expect(confirmButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Type DEACTIVATE to confirm'), 'DEACTIVATE');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(deactivateItem).toHaveBeenCalledWith('item-1');
    });
    expect(toast.success).toHaveBeenCalledWith('Item deactivated');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Deactivate item' })).not.toBeInTheDocument();
    });
    expect(vi.mocked(listItems).mock.calls.length).toBeGreaterThan(1);
  });

  it('keeps the deactivate dialog open and reports failures', async () => {
    vi.mocked(deactivateItem).mockRejectedValue(new Error('Item could not be deactivated'));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const dialog = await openDeactivateDialog(user);
    await user.type(within(dialog).getByLabelText('Type DEACTIVATE to confirm'), 'DEACTIVATE');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Item could not be deactivated');
    });
    expect(screen.getByRole('dialog', { name: 'Deactivate item' })).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('cancels deactivation without calling the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const dialog = await openDeactivateDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(deactivateItem).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Deactivate item' })).not.toBeInTheDocument();
    });
  });

  it('changes an item price from the row action menu using kobo', async () => {
    vi.mocked(changeItemPrice).mockResolvedValue(makeItem({ current_price: 200000 }));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: 'Change price' }));

    const dialog = await screen.findByRole('dialog', { name: 'Change price' });
    expect(within(dialog).getByText(formatNaira(1500))).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('New price'), '2000');
    await user.click(within(dialog).getByRole('button', { name: 'Update price' }));

    await waitFor(() => {
      expect(changeItemPrice).toHaveBeenCalledWith('item-1', { new_price: 200000 });
    });
    expect(toast.success).toHaveBeenCalledWith(
      `Price for "Coca-Cola 50cl" is now ${formatNaira(200000)}`,
    );
  });

  it('records a stock movement for an item from the row action menu', async () => {
    vi.mocked(recordMovement).mockResolvedValue({
      id: 'movement-9',
      item_id: 'item-1',
      quantity_change: 6,
      reason: 'restock',
      note: null,
      staff_id: 'staff-1',
      sale_id: null,
      refund_id: null,
      created_at: '2026-11-07T10:00:00.000Z',
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Coca-Cola 50cl');
    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: 'Record stock movement' }));

    const dialog = await screen.findByRole('dialog', { name: 'Record stock movement' });
    await user.type(within(dialog).getByLabelText('Quantity'), '6');
    await user.click(within(dialog).getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'receive',
        body: { quantity: 6 },
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Stock updated: Coca-Cola 50cl');
    await waitFor(() => expect(vi.mocked(listItems).mock.calls.length).toBeGreaterThan(1));
  });

  it('reactivates an inactive item from the row action menu', async () => {
    vi.mocked(reactivateItem).mockResolvedValue(makeItem({ id: 'item-2', active: true }));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Fanta Orange 50cl');
    const menu = await openItemRowActions(user, 'Fanta Orange 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: 'Reactivate item' }));

    const dialog = await screen.findByRole('dialog', { name: 'Reactivate item' });
    expect(within(dialog).getByText(/This will reactivate/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate' }));

    await waitFor(() => {
      expect(reactivateItem).toHaveBeenCalledWith('item-2');
    });
    expect(toast.success).toHaveBeenCalledWith('Item reactivated');
  });
});
