import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ItemFormDrawer } from '@/features/inventory/items/components/item-form-drawer';
import { createItem, updateItem } from '@/features/inventory/category/services/category.service';
import { categoryFixtures, itemFixtures, makeItem } from '../../helpers/items';

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
}

function renderDrawer({ mode = 'add', item = null }: RenderDrawerOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <ItemFormDrawer
        open
        onOpenChange={onOpenChange}
        mode={mode}
        item={item}
        units={units}
        categories={categoryFixtures}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
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
    await user.clear(screen.getByLabelText('Reorder threshold'));
    await user.type(screen.getByLabelText('Reorder threshold'), '4');
    await chooseOption(user, 'Category', 'Beverages');

    await user.click(screen.getByRole('button', { name: 'Save Item' }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Fanta 50cl',
          barcode: '9876543210',
          category_id: 'category-1',
          unit: 'bottle',
          current_price: 1200,
          cost_price: 900,
          reorder_threshold: 4,
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
    expect(screen.getByLabelText('Selling price')).toHaveValue(1500);
    expect(screen.getByLabelText('Cost price')).toHaveValue(1000);
    expect(screen.getByLabelText('Reorder threshold')).toHaveValue(5);
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Active');

    await user.clear(screen.getByLabelText('Item name'));
    await user.type(screen.getByLabelText('Item name'), 'Coca-Cola Zero');
    await chooseOption(user, 'Status', 'Inactive');
    await user.click(screen.getByRole('button', { name: 'Update Item' }));

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith('item-1', {
        name: 'Coca-Cola Zero',
        barcode: '1234567890',
        category_id: 'category-1',
        unit: 'bottle',
        cost_price: 1000,
        reorder_threshold: 5,
        active: false,
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Item "Coca-Cola Zero" updated successfully');
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
});
