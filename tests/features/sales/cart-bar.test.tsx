import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CartBar } from '@/features/sales/components/cart-bar';
import { formatNaira } from '@/features/admin/staff/utils';

describe('CartBar', () => {
  it('renders nothing for an empty cart', () => {
    render(<CartBar count={0} total={0} onCheckout={vi.fn()} onStart={vi.fn()} />);

    expect(screen.queryByRole('region', { name: 'Cart' })).not.toBeInTheDocument();
  });

  it('summarises the cart and starts checkout', async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();
    render(<CartBar count={3} total={5500} onCheckout={onCheckout} onStart={vi.fn()} />);

    const cart = screen.getByRole('region', { name: 'Cart' });
    expect(cart).toHaveTextContent('3 items');
    expect(cart).toHaveTextContent(formatNaira(5500));

    await user.click(screen.getByRole('button', { name: 'Checkout' }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('uses the singular label for one item', () => {
    render(<CartBar count={1} total={1500} onCheckout={vi.fn()} onStart={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Cart' })).toHaveTextContent('1 item');
  });

  it('disables checkout with a reason when there is no open shift', () => {
    render(
      <CartBar
        count={1}
        total={1500}
        disabled
        disabledReason="Clock in before making a sale"
        onCheckout={vi.fn()}
        onStart={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Checkout' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Clock in before making a sale');
  });
});
