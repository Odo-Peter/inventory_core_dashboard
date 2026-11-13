import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProductTile } from '@/features/sales/components/product-tile';
import { formatNaira } from '@/features/admin/staff/utils';
import { makeItem } from '../../helpers/items';

describe('ProductTile', () => {
  it('shows the item name and price per unit', () => {
    render(
      <ProductTile
        item={makeItem({ name: 'Coca-Cola 50cl', current_price: 1500, unit: 'bottle' })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(screen.getByText(`${formatNaira(1500)} / bottle`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'No image for Coca-Cola 50cl' })).toBeInTheDocument();
  });

  it('selects the item when tapped', async () => {
    const user = userEvent.setup();
    const item = makeItem();
    const onSelect = vi.fn();
    render(<ProductTile item={item} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Coca-Cola 50cl/ }));

    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it('shows a low stock label when stock is at the threshold', () => {
    render(
      <ProductTile
        item={makeItem({ stock_quantity: 3, reorder_threshold: 5 })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('3 left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coca-Cola 50cl/ })).toHaveAccessibleName(/3 left/);
  });

  it('does not show a low stock label when the threshold is disabled', () => {
    render(
      <ProductTile
        item={makeItem({ stock_quantity: 0, reorder_threshold: 0 })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
  });

  it('disables an out-of-stock item and labels it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ProductTile
        item={makeItem({ stock_quantity: 0, reorder_threshold: 5 })}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /out of stock/ });
    expect(button).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();

    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the thumb image variant when one is available', () => {
    render(
      <ProductTile
        item={makeItem({
          name: 'Fanta 50cl',
          image: { thumb: '/fanta-thumb.jpg', full: '/fanta-full.jpg' },
        })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'Fanta 50cl' })).toHaveAttribute(
      'src',
      '/fanta-thumb.jpg',
    );
  });
});
