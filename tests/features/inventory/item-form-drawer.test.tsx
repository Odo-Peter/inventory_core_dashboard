import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ItemFormDrawer } from '@/features/inventory/items/components/item-form-drawer';
import { createItem, updateItem } from '@/features/inventory/category/services/category.service';
import { formatNaira } from '@/features/admin/staff/utils';
import { categoryFixtures, itemFixtures, makeItem } from '../../helpers/items';
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
  getItemUnits: vi.fn(),
}));

const units = [
  { value: 'bottle', label: 'Bottle' },
  { value: 'pack', label: 'Pack' },
  { value: 'carton', label: 'Carton' },
];

interface RenderDrawerOptions {
  mode?: 'add' | 'edit';
  item?: (typeof itemFixtures)[number] | null;
  onChangePrice?: (item: (typeof itemFixtures)[number]) => void;
  onRecordStock?: (item: (typeof itemFixtures)[number]) => void;
  onToggleStatus?: (item: (typeof itemFixtures)[number]) => void;
}

function renderDrawer({
  mode = 'add',
  item = null,
  onChangePrice,
  onRecordStock,
  onToggleStatus,
}: RenderDrawerOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <RoleProvider role="admin">
      <QueryClientProvider client={queryClient}>
        <ItemFormDrawer
          open
          onOpenChange={onOpenChange}
          mode={mode}
          item={item}
          units={units}
          categories={categoryFixtures}
          onSuccess={onSuccess}
          onChangePrice={onChangePrice}
          onRecordStock={onRecordStock}
          onToggleStatus={onToggleStatus}
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

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Item name'), 'Fanta 50cl');
  await user.type(screen.getByLabelText('Selling price'), '1200');
}

describe('ItemFormDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required-field errors and does not create an empty item', async () => {
    const user = userEvent.setup();
    renderDrawer();

    expect(await screen.findByRole('heading', { name: 'Add item' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    expect(await screen.findByText('Item name is required')).toBeInTheDocument();
    expect(screen.getByText('Selling price is required')).toBeInTheDocument();
    expect(createItem).not.toHaveBeenCalled();
  });

  it('creates an item with the expected payload and reports success', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[1]);
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await user.type(screen.getByLabelText('Item name'), 'Fanta 50cl');
    await user.type(screen.getByLabelText('Barcode'), '9876543210');
    await user.type(screen.getByLabelText('Selling price'), '1200');
    await user.type(screen.getByLabelText('Cost price'), '900');
    await chooseOption(user, 'Category', 'Beverages');

    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Fanta 50cl',
          barcode: '9876543210',
          category_id: 'category-1',
          unit: 'bottle',
          // Money is stored as kobo: ₦1,200.00 and ₦900.00
          current_price: 120000,
          cost_price: 90000,
          // The reorder input was removed from the form, so the API default is sent.
          reorder_threshold: 0,
          active: true,
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Item "Fanta 50cl" created successfully');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('treats blank optional values as null when creating an item', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[0]);
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Fanta 50cl',
          barcode: null,
          category_id: null,
          cost_price: null,
          reorder_threshold: 0,
        }),
      );
    });
  });

  it('uploads an item image and allows removing it before saving', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[0]);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:item-preview'),
    });

    const user = userEvent.setup();
    renderDrawer();
    const image = new File(['fake-image'], 'cola.png', { type: 'image/png' });

    await screen.findByRole('heading', { name: 'Add item' });
    await user.upload(screen.getByLabelText('Image'), image);

    expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute(
      'src',
      'blob:item-preview',
    );

    await user.click(screen.getByRole('button', { name: 'Remove Item Image' }));
    expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Image')).toHaveValue('');
  });

  it('prefills an item and submits edited values', async () => {
    vi.mocked(updateItem).mockResolvedValue(makeItem({ name: 'Coca-Cola Zero' }));
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDrawer({
      mode: 'edit',
      item: itemFixtures[0],
    });

    expect(await screen.findByRole('heading', { name: 'Edit item' })).toBeInTheDocument();
    expect(screen.getByLabelText('Item name')).toHaveValue('Coca-Cola 50cl');
    expect(screen.getByLabelText('Barcode')).toHaveValue('1234567890');
    expect(screen.queryByLabelText('Selling price')).not.toBeInTheDocument();
    expect(screen.getByText(formatNaira(1500))).toBeInTheDocument();

    // Cost price is shown in naira (kobo / 100)
    expect(screen.getByLabelText('Cost price')).toHaveValue(10);

    expect(screen.queryByLabelText('Reorder threshold')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.getByText('Managed separately')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Item name'));
    await user.type(screen.getByLabelText('Item name'), 'Coca-Cola Zero');
    await user.click(screen.getByRole('button', { name: 'Update Item' }));

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith('item-1', {
        name: 'Coca-Cola Zero',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Item "Coca-Cola 50cl" updated successfully');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the drawer open and reports when saving fails', async () => {
    vi.mocked(createItem).mockRejectedValue(new Error('Item could not be created'));
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Item could not be created');
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Save Item' })).toBeEnabled();
  });

  it('closes without creating an item when cancelled', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await user.type(screen.getByLabelText('Item name'), 'Fanta 50cl');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createItem).not.toHaveBeenCalled();
  });

  it('blocks decimal prices because the price inputs still use step="1"', async () => {
    // Regression documentation: the API accepts kobo, but both price inputs retain
    // step="1". Native form validation therefore rejects values such as 1500.50 and
    // the submit handler never runs. See the test report's "Possible bugs" section.
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await user.type(screen.getByLabelText('Item name'), 'Precision Item');
    await user.type(screen.getByLabelText('Selling price'), '1500.50');
    await user.type(screen.getByLabelText('Cost price'), '1000.25');

    const sellingPrice = screen.getByLabelText('Selling price') as HTMLInputElement;
    const costPrice = screen.getByLabelText('Cost price') as HTMLInputElement;

    expect(sellingPrice).toHaveValue(1500.5);
    expect(sellingPrice.step).toBe('1');
    expect(sellingPrice.validity.stepMismatch).toBe(true);
    expect(costPrice.validity.stepMismatch).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Save Item' }));
    expect(createItem).not.toHaveBeenCalled();
  });

  it('converts whole-naira form values to kobo', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[0]);
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByRole('heading', { name: 'Add item' });
    await user.type(screen.getByLabelText('Item name'), 'Whole Naira Item');
    await user.type(screen.getByLabelText('Selling price'), '1500');
    await user.type(screen.getByLabelText('Cost price'), '1000');
    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          current_price: 150000,
          cost_price: 100000,
        }),
      );
    });
  });

  it('includes the uploaded image in the create payload', async () => {
    vi.mocked(createItem).mockResolvedValue(itemFixtures[0]);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:item-preview'),
    });

    const user = userEvent.setup();
    renderDrawer();
    const image = new File(['fake-image'], 'cola.png', { type: 'image/png' });

    await screen.findByRole('heading', { name: 'Add item' });
    await fillRequiredFields(user);
    await user.upload(screen.getByLabelText('Image'), image);
    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(expect.objectContaining({ image }));
    });
  });

  it('disables saving edit mode until something changes', async () => {
    const user = userEvent.setup();
    // cost_price is null so the known kobo/naira default bug does not already
    // register a change on mount.
    renderDrawer({ mode: 'edit', item: makeItem({ cost_price: null }) });

    await screen.findByRole('heading', { name: 'Edit item' });

    expect(screen.getByText('No changes to save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Item' })).toBeDisabled();
    expect(updateItem).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Item name'), ' Zero');
    expect(screen.queryByText('No changes to save')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Item' })).toBeEnabled();
  });

  it('delegates price, stock, and status changes from the managed section', async () => {
    const user = userEvent.setup();
    const onChangePrice = vi.fn();
    const onRecordStock = vi.fn();
    const onToggleStatus = vi.fn();
    renderDrawer({
      mode: 'edit',
      item: itemFixtures[0],
      onChangePrice,
      onRecordStock,
      onToggleStatus,
    });

    await screen.findByRole('heading', { name: 'Edit item' });
    await user.click(screen.getByRole('button', { name: 'Change price' }));
    await user.click(screen.getByRole('button', { name: 'Record movement' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(onChangePrice).toHaveBeenCalledWith(itemFixtures[0]);
    expect(onRecordStock).toHaveBeenCalledWith(itemFixtures[0]);
    expect(onToggleStatus).toHaveBeenCalledWith(itemFixtures[0]);
  });

  it('uses "Reactivate" for an inactive item in the managed section', async () => {
    const user = userEvent.setup();
    const onToggleStatus = vi.fn();
    const inactive = makeItem({ name: 'Fanta Orange 50cl', active: false });
    renderDrawer({ mode: 'edit', item: inactive, onToggleStatus });

    await screen.findByRole('heading', { name: 'Edit item' });
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));

    expect(onToggleStatus).toHaveBeenCalledWith(inactive);
  });
});
