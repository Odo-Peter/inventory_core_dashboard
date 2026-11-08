import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordMovementDrawer } from '@/features/inventory/stock/components/record-movement-drawer';
import { getStockStatus, recordMovement } from '@/features/inventory/stock/services/stock.service';
import { listItems } from '@/features/inventory/category/services/category.service';
import { buildMovement, buildStockStatus } from '../../../helpers/stock';
import { listItemsResponse, makeItem } from '../../../helpers/items';
import { RoleProvider } from '../../../helpers/role';

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

const pickedItem = { id: 'item-1', name: 'Coca-Cola 50cl', sku: 'SKU-001' };

function renderDrawer({
  open = true,
  initialItem = pickedItem,
  onOpenChange = vi.fn(),
  onSuccess = vi.fn(),
}: {
  open?: boolean;
  initialItem?: { id: string; name: string; sku: string } | null;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <RoleProvider>
      <QueryClientProvider client={queryClient}>
        <RecordMovementDrawer
          open={open}
          onOpenChange={onOpenChange}
          initialItem={initialItem}
          onSuccess={onSuccess}
        />
      </QueryClientProvider>
    </RoleProvider>,
  );

  return { onOpenChange, onSuccess };
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('RecordMovementDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listItems).mockResolvedValue(listItemsResponse());
    vi.mocked(getStockStatus).mockResolvedValue(buildStockStatus());
    vi.mocked(recordMovement).mockResolvedValue(buildMovement());
  });

  it('preselects the item, defaults to receive, and shows the current stock', async () => {
    renderDrawer();

    expect(screen.getByRole('heading', { name: 'Record stock movement' })).toBeInTheDocument();
    expect(screen.getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(await screen.findByText(/SKU-001 · 24 in stock/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'What happened?' })).toHaveTextContent(
      'Receive stock (supplier delivery)',
    );
    expect(screen.getByLabelText('Supplier')).toBeInTheDocument();
    expect(screen.getByLabelText('Delivery reference')).toBeInTheDocument();
    expect(screen.getByLabelText('Note')).toHaveAttribute('placeholder', 'Enter a note (optional)');
    expect(screen.queryByRole('combobox', { name: 'Direction' })).not.toBeInTheDocument();
  });

  it('does not mount the form while the drawer is closed', () => {
    renderDrawer({ open: false });

    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
    expect(listItems).not.toHaveBeenCalled();
  });

  it('records a receive with trimmed optional details and reports success', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '6');
    await user.type(screen.getByLabelText('Supplier'), '  Acme Stores  ');
    await user.type(screen.getByLabelText('Delivery reference'), ' INV-20418 ');
    await user.type(screen.getByLabelText('Note'), '  Morning delivery  ');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'receive',
        body: {
          quantity: 6,
          note: 'Morning delivery',
          supplier_name: 'Acme Stores',
          delivery_reference: 'INV-20418',
        },
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Stock updated: Coca-Cola 50cl');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('omits blank optional receive details from the payload', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '2');
    await user.type(screen.getByLabelText('Supplier'), '   ');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'receive',
        body: { quantity: 2 },
      });
    });
  });

  it('records an adjustment as a negative change and requires a note', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText('Quantity'), '3');
    await chooseOption(user, 'What happened?', 'Adjust (correct the count)');
    await chooseOption(user, 'Direction', 'Remove from stock');

    expect(screen.getByLabelText('Note')).toHaveAttribute('placeholder', 'Why is this needed?');

    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    expect(await screen.findByText('Add a note explaining why')).toBeInTheDocument();
    expect(recordMovement).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Note'), 'Count correction');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'adjust',
        body: { quantity_change: -3, note: 'Count correction' },
      });
    });
  });

  it('records a positive adjustment when adding to stock', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText('Quantity'), '4');
    await chooseOption(user, 'What happened?', 'Adjust (correct the count)');
    await user.type(screen.getByLabelText('Note'), 'Found extras');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'adjust',
        body: { quantity_change: 4, note: 'Found extras' },
      });
    });
  });

  it('records damage with a positive quantity and requires a note', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText('Quantity'), '2');
    await chooseOption(user, 'What happened?', 'Damaged or lost');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    expect(await screen.findByText('Add a note explaining why')).toBeInTheDocument();
    expect(recordMovement).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Note'), 'Bottle broke');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
        itemId: 'item-1',
        action: 'damage',
        body: { quantity: 2, note: 'Bottle broke' },
      });
    });
  });

  it('blocks an overdraw and previews the resulting stock', async () => {
    const user = userEvent.setup();
    vi.mocked(getStockStatus).mockResolvedValue(buildStockStatus({ stock_quantity: 3 }));
    renderDrawer();

    await screen.findByText(/3 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '5');
    await chooseOption(user, 'What happened?', 'Damaged or lost');

    expect(screen.getByText('Stock cannot go below zero')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record movement' })).toBeDisabled();
    expect(recordMovement).not.toHaveBeenCalled();
  });

  it('previews the stock change for a valid quantity', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '6');

    expect(screen.getByText(/Stock: 24 →/)).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('maps insufficient stock errors to the quantity field and toast', async () => {
    vi.mocked(recordMovement).mockRejectedValue({
      response: { data: { code: 'insufficient_stock' } },
    });
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '5');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stock cannot go below zero.');
    });
    expect(screen.getAllByText('Stock cannot go below zero.').length).toBeGreaterThan(0);
  });

  it.each([
    ['item_inactive', 'Reactivate this item before changing its stock this way.'],
    ['initial_stock_exists', 'Opening stock has already been recorded for this item.'],
    ['item_not_found', 'This item no longer exists.'],
  ])('maps the %s error code to a readable message', async (code, message) => {
    vi.mocked(recordMovement).mockRejectedValue({ code });
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '1');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
  });

  it('falls back to the error message for unknown failures', async () => {
    vi.mocked(recordMovement).mockRejectedValue(new Error('Network down'));
    const user = userEvent.setup();
    const { onSuccess, onOpenChange } = renderDrawer();

    await screen.findByText(/24 in stock/);
    await user.type(screen.getByLabelText('Quantity'), '1');
    await user.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Network down'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('searches for and selects an item when none was preselected', async () => {
    const fanta = makeItem({
      id: 'item-2',
      name: 'Fanta Orange 50cl',
      sku: 'SKU-002',
      stock_quantity: 3,
    });
    vi.mocked(listItems).mockResolvedValue(listItemsResponse([fanta]));
    vi.mocked(getStockStatus).mockResolvedValue(
      buildStockStatus({ item_id: 'item-2', stock_quantity: 3 }),
    );
    const user = userEvent.setup();
    renderDrawer({ initialItem: null });

    const search = await screen.findByLabelText('Item');
    await user.type(search, 'fan');

    const result = await screen.findByRole('button', { name: /Fanta Orange 50cl/ });
    expect(within(result).getByText('SKU-002')).toBeInTheDocument();
    await user.click(result);

    expect(await screen.findByText('Fanta Orange 50cl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    await waitFor(() => expect(getStockStatus).toHaveBeenCalledWith('item-2'));
    expect(listItems).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, page_size: 6, active: true, q: 'fan' }),
    );
  });

  it('shows an empty search result and can clear the chosen item', async () => {
    vi.mocked(listItems).mockResolvedValue(listItemsResponse([]));
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'Change' }));

    expect(await screen.findByText('No items found')).toBeInTheDocument();
    expect(screen.queryByText('Coca-Cola 50cl')).not.toBeInTheDocument();
  });

  it('cancels without recording anything', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDrawer();

    await user.type(screen.getByLabelText('Quantity'), '5');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(recordMovement).not.toHaveBeenCalled();
  });

  it('rejects a zero or fractional quantity before submitting', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText('Quantity'), '0');
    fireEvent.submit(screen.getByLabelText('Quantity').closest('form')!);

    expect(await screen.findByText('Enter a whole number above zero')).toBeInTheDocument();
    expect(recordMovement).not.toHaveBeenCalled();
  });

  it('disables opening stock once an item has movement history and falls back from receive', async () => {
    vi.mocked(getStockStatus).mockResolvedValue(
      buildStockStatus({ receive_allowed: false, opening_stock_allowed: false }),
    );
    renderDrawer();

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'What happened?' })).toHaveTextContent(
        'Adjust (correct the count)',
      ),
    );

    await userEvent.setup().click(screen.getByRole('combobox', { name: 'What happened?' }));
    expect(
      await screen.findByRole('option', {
        name: 'Receive stock (supplier delivery): item is inactive',
      }),
    ).toHaveAttribute('aria-disabled', 'true');

    expect(
      screen.getByRole('option', {
        name: 'Opening stock (first count): already has stock history',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
});
