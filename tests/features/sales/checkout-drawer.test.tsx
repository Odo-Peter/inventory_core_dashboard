import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-error';
import { formatNaira } from '@/features/admin/staff/utils';
import { CheckoutDrawer } from '@/features/sales/components/checkout-drawer';
import { createSale, getPaymentOptions } from '@/features/sales/services/sales.service';
import type { CartLine } from '@/features/sales/types';
import type { ItemResponse } from '@/features/inventory/items/types';
import { makeItem } from '../../helpers/items';
import { makePaymentOptions, makeSale } from '../../helpers/sales';

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

const itemA = makeItem({
  id: 'item-1',
  name: 'Coca-Cola 50cl',
  current_price: 1500,
  stock_quantity: 10,
});
const itemB = makeItem({
  id: 'item-2',
  name: 'Bottled Water 75cl',
  current_price: 800,
  stock_quantity: 5,
});

const defaultLines: CartLine[] = [
  { item: itemA, quantity: 2 },
  { item: itemB, quantity: 1 },
];

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions {
  lines?: CartLine[];
  total?: number;
  open?: boolean;
  checkoutDisabled?: boolean;
  disabledReason?: string;
  onOpenChange?: (open: boolean) => void;
  onSetQuantity?: (itemId: string, quantity: number) => void;
  onRemove?: (itemId: string) => void;
  onRefreshItems?: () => Promise<ItemResponse[] | undefined>;
  onSyncItems?: (items: ItemResponse[]) => void;
  onCompleted?: (sale: ReturnType<typeof makeSale>) => void;
}

function renderCheckout({
  lines = defaultLines,
  total = 3800,
  open = true,
  checkoutDisabled,
  disabledReason,
  onOpenChange = vi.fn(),
  onSetQuantity = vi.fn(),
  onRemove = vi.fn(),
  onRefreshItems = vi.fn().mockResolvedValue(undefined),
  onSyncItems = vi.fn(),
  onCompleted = vi.fn(),
}: RenderOptions = {}) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CheckoutDrawer
        open={open}
        onOpenChange={onOpenChange}
        lines={lines}
        total={total}
        checkoutDisabled={checkoutDisabled}
        disabledReason={disabledReason}
        onSetQuantity={onSetQuantity}
        onRemove={onRemove}
        onRefreshItems={onRefreshItems}
        onSyncItems={onSyncItems}
        onCompleted={onCompleted}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSetQuantity, onRemove, onRefreshItems, onSyncItems, onCompleted };
}

/** Mirrors NewSalePage wiring so a refresh really updates the cart snapshots. */
function CheckoutHarness({
  initialLines,
  onRefreshItems,
  onCompleted,
}: {
  initialLines: CartLine[];
  onRefreshItems: () => Promise<ItemResponse[] | undefined>;
  onCompleted?: (sale: ReturnType<typeof makeSale>) => void;
}) {
  const [lines, setLines] = useState(initialLines);

  const syncItems = (items: ItemResponse[]) => {
    setLines((prev) =>
      prev.map((line) => {
        const next = items.find((item) => item.id === line.item.id);
        return next ? { ...line, item: next } : line;
      }),
    );
  };

  return (
    <CheckoutDrawer
      open
      onOpenChange={vi.fn()}
      lines={lines}
      total={lines.reduce((sum, line) => sum + line.quantity * line.item.current_price, 0)}
      onSetQuantity={(itemId, quantity) =>
        setLines((prev) =>
          prev.map((line) => (line.item.id === itemId ? { ...line, quantity } : line)),
        )
      }
      onRemove={(itemId) => setLines((prev) => prev.filter((line) => line.item.id !== itemId))}
      onRefreshItems={onRefreshItems}
      onSyncItems={syncItems}
      onCompleted={onCompleted ?? vi.fn()}
    />
  );
}

function renderHarness(
  initialLines: CartLine[],
  onRefreshItems: () => Promise<ItemResponse[] | undefined>,
) {
  const onCompleted = vi.fn();
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CheckoutHarness
        initialLines={initialLines}
        onRefreshItems={onRefreshItems}
        onCompleted={onCompleted}
      />
    </QueryClientProvider>,
  );
  return { onCompleted };
}

async function waitForPaymentOptions() {
  const method = await screen.findByRole('combobox', { name: 'Payment method' });
  await waitFor(() => expect(method).not.toBeDisabled());
  return method;
}

async function choosePaymentMethod(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await waitForPaymentOptions());
  await user.click(await screen.findByRole('option', { name: label }));
}

describe('CheckoutDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPaymentOptions).mockResolvedValue(makePaymentOptions());
    vi.mocked(createSale).mockResolvedValue(makeSale());
  });

  it('renders the cart, total, and payment options', async () => {
    renderCheckout();

    const dialog = screen.getByRole('dialog', { name: 'Checkout' });
    expect(within(dialog).getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(within(dialog).getByText('Bottled Water 75cl')).toBeInTheDocument();
    expect(within(dialog).getByText(formatNaira(3800))).toBeInTheDocument();

    const method = await waitForPaymentOptions();
    expect(method).toHaveTextContent('Cash');
  });

  it('shows an empty cart message and disables checkout', async () => {
    renderCheckout({ lines: [], total: 0 });

    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete sale' })).toBeDisabled();
  });

  it('submits a cash sale with kobo totals and an idempotency key', async () => {
    const user = userEvent.setup();
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000001');
    const { onCompleted } = renderCheckout();

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
    expect(createSale).toHaveBeenCalledWith({
      items: [
        { item_id: 'item-1', quantity: 2 },
        { item_id: 'item-2', quantity: 1 },
      ],
      payment_method: 'cash',
      expected_total: 3800,
      idempotency_key: '00000000-0000-4000-8000-000000000001',
    });
    // The next sale gets a fresh key.
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  it('does not send a POS account for cash sales', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    await waitFor(() => expect(createSale).toHaveBeenCalled());
    expect(vi.mocked(createSale).mock.calls[0][0]).not.toHaveProperty('pos_account_id');
  });

  it('auto-selects the only account for a card payment', async () => {
    const user = userEvent.setup();
    const { onCompleted } = renderCheckout();

    await choosePaymentMethod(user, 'Card');

    expect(await screen.findByRole('combobox', { name: 'POS account' })).toHaveTextContent(
      'Terminal 1',
    );

    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalled());
    expect(createSale).toHaveBeenCalledWith({
      items: [
        { item_id: 'item-1', quantity: 2 },
        { item_id: 'item-2', quantity: 1 },
      ],
      payment_method: 'card',
      pos_account_id: 'terminal-1',
      expected_total: 3800,
      idempotency_key: expect.any(String),
    });
  });

  it('requires choosing an account when several are available', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await choosePaymentMethod(user, 'Bank transfer');
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(
      await screen.findByText('Choose an account for this payment method'),
    ).toBeInTheDocument();
    expect(createSale).not.toHaveBeenCalled();

    await user.click(screen.getByRole('combobox', { name: 'POS account' }));
    await user.click(await screen.findByRole('option', { name: 'GTBank' }));
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    await waitFor(() => expect(createSale).toHaveBeenCalled());
    expect(vi.mocked(createSale).mock.calls[0][0]).toMatchObject({
      payment_method: 'bank_transfer',
      pos_account_id: 'bank-1',
    });
  });

  it('updates quantities and removes lines', async () => {
    const user = userEvent.setup();
    const { onSetQuantity, onRemove } = renderCheckout();

    await user.click(screen.getByRole('button', { name: 'Increase quantity for Coca-Cola 50cl' }));
    expect(onSetQuantity).toHaveBeenCalledWith('item-1', 3);

    await user.click(screen.getByRole('button', { name: 'Decrease quantity for Coca-Cola 50cl' }));
    expect(onSetQuantity).toHaveBeenCalledWith('item-1', 1);

    await user.click(screen.getByRole('button', { name: 'Remove Bottled Water 75cl' }));
    expect(onRemove).toHaveBeenCalledWith('item-2');
  });

  it('disables checkout when there is no open shift', async () => {
    const { onCompleted } = renderCheckout({
      checkoutDisabled: true,
      disabledReason: 'Clock in before making a sale',
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Clock in before making a sale');
    expect(screen.getByRole('button', { name: 'Complete sale' })).toBeDisabled();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('shows a pending state while the sale is being recorded', async () => {
    const user = userEvent.setup();
    let resolveSale: (sale: ReturnType<typeof makeSale>) => void = () => {};
    vi.mocked(createSale).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSale = resolve;
        }),
    );
    const { onCompleted } = renderCheckout();

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(await screen.findByRole('button', { name: /Saving/ })).toBeDisabled();

    resolveSale(makeSale());
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
  });

  it('shows a shift error and reuses the idempotency key on retry', async () => {
    const user = userEvent.setup();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000002');
    vi.mocked(createSale)
      .mockRejectedValueOnce(new ApiError('no shift', { code: 'no_open_shift' }))
      .mockResolvedValueOnce(makeSale());
    const { onCompleted } = renderCheckout();

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(await screen.findByText('Clock in before making a sale')).toBeInTheDocument();
    expect(onCompleted).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Complete sale' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));

    const [firstPayload, secondPayload] = vi.mocked(createSale).mock.calls;
    expect(firstPayload[0].idempotency_key).toBe('00000000-0000-4000-8000-000000000002');
    expect(secondPayload[0].idempotency_key).toBe('00000000-0000-4000-8000-000000000002');
  });

  it('puts a payment account error on the account field', async () => {
    const user = userEvent.setup();
    vi.mocked(createSale).mockRejectedValue(
      new ApiError('bad account', { code: 'payment_account_required' }),
    );
    renderCheckout();

    await choosePaymentMethod(user, 'Card');
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(
      await screen.findByText('Choose an account for this payment method'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'POS account' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('refreshes items and flags a line when stock changed on the server', async () => {
    const user = userEvent.setup();
    const freshItems = [
      makeItem({ id: 'item-1', name: 'Coca-Cola 50cl', current_price: 1700, stock_quantity: 1 }),
      itemB,
    ];
    const onRefreshItems = vi.fn().mockResolvedValue(freshItems);
    vi.mocked(createSale).mockRejectedValue(
      new ApiError('stock changed', { code: 'insufficient_stock' }),
    );
    renderHarness(defaultLines, onRefreshItems);

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    await waitFor(() => expect(onRefreshItems).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Only 1 left. Lower the quantity to continue.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Some items no longer have enough stock. Review the flagged lines.'),
    ).toBeInTheDocument();
    // The refreshed price is now used for the cart summary (2 × ₦17.00 + ₦8.00).
    expect(screen.getByText(formatNaira(4200))).toBeInTheDocument();
  });

  it('flags an item that became inactive during checkout', async () => {
    const user = userEvent.setup();
    const freshItems = [
      makeItem({ id: 'item-1', name: 'Coca-Cola 50cl', stock_quantity: 10, active: false }),
      itemB,
    ];
    vi.mocked(createSale).mockRejectedValue(new ApiError('inactive', { code: 'item_inactive' }));
    renderHarness(defaultLines, vi.fn().mockResolvedValue(freshItems));

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(
      await screen.findByText('This item is no longer available. Remove it to continue.'),
    ).toBeInTheDocument();
  });

  it('shows the payment options error and retries', async () => {
    const user = userEvent.setup();
    vi.mocked(getPaymentOptions)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(makePaymentOptions());
    renderCheckout();

    expect(await screen.findByText('Could not load payment options.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Payment method' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Payment method' })).not.toBeDisabled(),
    );
    expect(getPaymentOptions).toHaveBeenCalledTimes(2);
  });

  it('keeps the sheet open when the sale fails', async () => {
    const user = userEvent.setup();
    vi.mocked(createSale).mockRejectedValue(
      new ApiError('too large', { code: 'sale_total_too_large' }),
    );
    const { onOpenChange } = renderCheckout();

    await waitForPaymentOptions();
    await user.click(screen.getByRole('button', { name: 'Complete sale' }));

    expect(
      await screen.findByText(
        'This sale is too large to record. Reduce the quantities and try again.',
      ),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
