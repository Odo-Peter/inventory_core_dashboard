import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ItemDetailsDrawer } from '@/features/inventory/items/components/item-details-drawer';
import { itemFixtures, makeItem } from '../../helpers/items';

function renderDrawer({
  item = itemFixtures[0],
  categoryName = 'Beverages',
  onOpenChange = vi.fn(),
}: {
  item?: (typeof itemFixtures)[number] | null;
  categoryName?: string;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  render(
    <ItemDetailsDrawer open onOpenChange={onOpenChange} item={item} categoryName={categoryName} />,
  );

  return { onOpenChange };
}

describe('ItemDetailsDrawer', () => {
  it('shows inventory, pricing, status, and identifier details for an item', () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Item details' });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText('Inventory, pricing, and status information for this item.'),
    ).toBeInTheDocument();

    expect(within(dialog).getAllByText('Active')).toHaveLength(2);
    expect(within(dialog).getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(within(dialog).getByText('SKU-001')).toBeInTheDocument();
    expect(within(dialog).getByText('1234567890')).toBeInTheDocument();
    expect(within(dialog).getByText('Beverages')).toBeInTheDocument();
    expect(within(dialog).getByText('bottle')).toBeInTheDocument();
    expect(within(dialog).getByText('1,500')).toBeInTheDocument();
    expect(within(dialog).getByText('1,000')).toBeInTheDocument();
    expect(within(dialog).getByText('24 bottle(s)')).toBeInTheDocument();
    expect(within(dialog).getByText('5')).toBeInTheDocument();
    expect(within(dialog).getByText('item-1')).toBeInTheDocument();
    expect(within(dialog).getByText('store-1')).toBeInTheDocument();
  });

  it('shows fallbacks for missing barcode, category, and cost price', () => {
    renderDrawer({
      item: makeItem({
        barcode: null,
        category_id: null,
        cost_price: null,
        name: 'Loose Sweets',
        sku: 'SKU-010',
      }),
      categoryName: '',
    });

    const dialog = screen.getByRole('dialog', { name: 'Item details' });
    expect(within(dialog).getAllByText('—')).toHaveLength(2);
    expect(within(dialog).getByText('Uncategorized')).toBeInTheDocument();
    expect(within(dialog).getByText('Loose Sweets')).toBeInTheDocument();
  });

  it('highlights inactive and low-stock items', () => {
    renderDrawer({
      item: makeItem({
        name: 'Almost Gone',
        active: false,
        stock_quantity: 2,
        reorder_threshold: 5,
      }),
    });

    const dialog = screen.getByRole('dialog', { name: 'Item details' });
    expect(within(dialog).getAllByText('Inactive')).toHaveLength(2);
    expect(within(dialog).getByText('Low stock')).toBeInTheDocument();
  });

  it('renders nothing inside the sheet when no item is selected', () => {
    renderDrawer({ item: null });

    expect(screen.queryByRole('dialog', { name: 'Item details' })).not.toBeInTheDocument();
  });

  it('closes the drawer from the footer button', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Item details' });
    await user.click(within(dialog).getAllByRole('button', { name: 'Close' })[0]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
