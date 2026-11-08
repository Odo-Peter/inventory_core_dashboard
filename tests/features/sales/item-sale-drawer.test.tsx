import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ItemSaleDrawer } from '@/features/sales/components/item-sale-drawer';
import { formatNaira } from '@/features/admin/staff/utils';
import { makeItem } from '../../helpers/items';

function renderDrawer({
  item = makeItem(),
  cartQuantity = 0,
  open = true,
  onOpenChange = vi.fn(),
  onConfirm = vi.fn(),
}: {
  item?: ReturnType<typeof makeItem> | null;
  cartQuantity?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (item: ReturnType<typeof makeItem>, quantity: number) => void;
} = {}) {
  render(
    <ItemSaleDrawer
      open={open}
      onOpenChange={onOpenChange}
      item={item}
      cartQuantity={cartQuantity}
      onConfirm={onConfirm}
    />,
  );

  return { onOpenChange, onConfirm };
}

describe('ItemSaleDrawer', () => {
  it('shows the item, price, and stock', () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Add to cart' });
    expect(within(dialog).getByRole('heading', { name: 'Coca-Cola 50cl' })).toBeInTheDocument();
    expect(within(dialog).getByText('SKU-001')).toBeInTheDocument();
    expect(within(dialog).getByText('24 in stock')).toBeInTheDocument();
    expect(within(dialog).getAllByText(formatNaira(1500)).length).toBeGreaterThan(0);
    expect(within(dialog).getByText('bottle')).toBeInTheDocument();
  });

  it('starts at one and steps the quantity with a live total', async () => {
    const user = userEvent.setup();
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Add to cart' });
    const quantity = dialog.querySelector('output') as HTMLOutputElement;

    expect(quantity).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));

    expect(quantity).toHaveTextContent('2');
    expect(within(dialog).getByText(formatNaira(3000))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(quantity).toHaveTextContent('1');
  });

  it('cannot exceed available stock', async () => {
    const user = userEvent.setup();
    renderDrawer({ item: makeItem({ stock_quantity: 2 }) });

    const increase = screen.getByRole('button', { name: 'Increase quantity' });
    await user.click(increase);

    expect(screen.getByRole('dialog').querySelector('output')).toHaveTextContent('2');
    expect(increase).toBeDisabled();
  });

  it('adds the chosen quantity to the cart and closes', async () => {
    const user = userEvent.setup();
    const item = makeItem();
    const { onConfirm, onOpenChange } = renderDrawer({ item });

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(onConfirm).toHaveBeenCalledWith(item, 3);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('prefills an existing cart quantity and updates instead of adding', async () => {
    const user = userEvent.setup();
    const item = makeItem();
    const { onConfirm } = renderDrawer({ item, cartQuantity: 2 });

    const dialog = screen.getByRole('dialog', { name: 'Add to cart' });
    expect(dialog.querySelector('output')).toHaveTextContent('2');
    expect(
      within(dialog).getByText('2 already in the cart. Choosing a new quantity replaces it.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update cart' }));

    expect(onConfirm).toHaveBeenCalledWith(item, 2);
  });

  it('clamps a stale cart quantity to the current stock', () => {
    renderDrawer({ item: makeItem({ stock_quantity: 3 }), cartQuantity: 10 });

    expect(screen.getByRole('dialog').querySelector('output')).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('flags low stock', () => {
    renderDrawer({ item: makeItem({ stock_quantity: 3, reorder_threshold: 5 }) });

    expect(screen.getByText('3 in stock')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('prevents selling an out-of-stock item', () => {
    renderDrawer({ item: makeItem({ stock_quantity: 0, reorder_threshold: 5 }) });

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('cancels without confirming', async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders the image variant when one is available', () => {
    renderDrawer({ item: makeItem({ name: 'Fanta 50cl', variants: { thumb: '/fanta.jpg' } }) });

    expect(screen.getByRole('img', { name: 'Fanta 50cl' })).toHaveAttribute('src', '/fanta.jpg');
  });
});
