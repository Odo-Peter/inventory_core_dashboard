import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChangePriceDialog } from '@/features/inventory/items/components/change-price-dialog';
import { changeItemPrice } from '@/features/inventory/category/services/category.service';
import { formatNaira } from '@/features/admin/staff/utils';
import { itemFixtures, makeItem } from '../../helpers/items';

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

function renderDialog({
  item = itemFixtures[0],
  open = true,
  onOpenChange = vi.fn(),
  onSuccess = vi.fn(),
}: {
  item?: (typeof itemFixtures)[number] | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (updated: (typeof itemFixtures)[number]) => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ChangePriceDialog
        item={item}
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

describe('ChangePriceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the current price and previews the increase', async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'Change price' });
    expect(
      screen.getByText("Coca-Cola 50cl. The change is recorded in the item's price history."),
    ).toBeInTheDocument();
    expect(screen.getByText('Current price')).toBeInTheDocument();
    expect(screen.getByText(formatNaira(1500))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update price' })).toBeDisabled();

    await user.type(screen.getByLabelText('New price'), '2000');

    expect(screen.getByText('+₦1,985.00 (+13233.3%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update price' })).toBeEnabled();
    expect(dialog).toBeInTheDocument();
  });

  it('previews a decrease with a true minus sign', async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '10');

    expect(screen.getByText('−₦5.00 (−33.3%)')).toBeInTheDocument();
  });

  it('updates the price in kobo and reports success', async () => {
    const updated = makeItem({ current_price: 200000 });
    vi.mocked(changeItemPrice).mockResolvedValue(updated);
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '2000');
    await user.click(screen.getByRole('button', { name: 'Update price' }));

    await waitFor(() => {
      expect(changeItemPrice).toHaveBeenCalledWith('item-1', { new_price: 200000 });
    });
    expect(toast.success).toHaveBeenCalledWith(
      `Price for "Coca-Cola 50cl" is now ${formatNaira(200000)}`,
    );
    expect(onSuccess).toHaveBeenCalledWith(updated);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks an unchanged price', async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '15');

    expect(screen.getByText('This is already the current price')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update price' })).toBeDisabled();
    expect(changeItemPrice).not.toHaveBeenCalled();
  });

  it('blocks invalid and negative prices', async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '-5');

    expect(screen.getByRole('button', { name: 'Update price' })).toBeDisabled();
    expect(changeItemPrice).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and reports failures', async () => {
    vi.mocked(changeItemPrice).mockRejectedValue(new Error('Could not change the price'));
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '2000');
    await user.click(screen.getByRole('button', { name: 'Update price' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Could not change the price');
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: 'Change price' })).toBeInTheDocument();
  });

  it('renders nothing when there is no item', () => {
    renderDialog({ item: null });

    expect(screen.queryByLabelText('New price')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update price' })).not.toBeInTheDocument();
  });

  it('closes without saving when cancelled', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await screen.findByRole('dialog', { name: 'Change price' });
    await user.type(screen.getByLabelText('New price'), '2000');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(changeItemPrice).not.toHaveBeenCalled();
  });
});
