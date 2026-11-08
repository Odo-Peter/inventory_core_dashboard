import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SaleDetailsDrawer } from '@/features/sales/components/sale-details-drawer';
import { getSale, printSaleReceipt } from '@/features/sales/services/sales.service';
import { formatNaira } from '@/features/admin/staff/utils';
import { makeReceipt, makeSale } from '../../helpers/sales';

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

function renderDrawer({
  saleId = 'sale-1',
  open = true,
  onOpenChange = vi.fn(),
}: {
  saleId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SaleDetailsDrawer open={open} onOpenChange={onOpenChange} saleId={saleId} />
    </QueryClientProvider>,
  );

  return { onOpenChange };
}

describe('SaleDetailsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSale).mockResolvedValue(makeSale());
    vi.mocked(printSaleReceipt).mockResolvedValue(makeReceipt({ is_copy: true, print_number: 2 }));
  });

  it('renders a read-only record of the sale', async () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Sale details' });
    expect(await within(dialog).findByText('Receipt #1042')).toBeInTheDocument();
    expect(within(dialog).getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(within(dialog).getByText('SKU-001')).toBeInTheDocument();
    expect(within(dialog).getByText('Bottled Water 75cl')).toBeInTheDocument();
    expect(within(dialog).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(dialog).getByTestId('sale-total')).toHaveTextContent(formatNaira(3800));
    expect(within(dialog).getAllByText('Cash').length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(
        'A read-only record of a completed sale. Sales cannot be edited or deleted.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the POS account label for a card sale', async () => {
    vi.mocked(getSale).mockResolvedValue(
      makeSale({
        payment_method: 'card',
        payment: {
          id: 'payment-1',
          method: 'card',
          amount: 3800,
          pos_account_id: 'terminal-1',
          account_label: 'Terminal 1',
        },
      }),
    );
    renderDrawer();

    expect(await screen.findByText('Terminal 1')).toBeInTheDocument();
    expect(screen.getAllByText('Card').length).toBeGreaterThan(0);
  });

  it('loads details only while the drawer is open', () => {
    renderDrawer({ saleId: null });

    expect(getSale).not.toHaveBeenCalled();
  });

  it('shows an error state and retries', async () => {
    const user = userEvent.setup();
    vi.mocked(getSale).mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(makeSale());
    renderDrawer();

    expect(await screen.findByText('Failed to load this sale')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Receipt #1042')).toBeInTheDocument();
    expect(getSale).toHaveBeenCalledTimes(2);
  });

  it('reprints the receipt and can print it', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText('Receipt #1042');
    expect(screen.queryByTestId('receipt-view')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reprint receipt' }));

    await waitFor(() => expect(printSaleReceipt).toHaveBeenCalledWith('sale-1'));
    expect(await screen.findByTestId('receipt-view')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-copy')).toHaveTextContent('Copy');
    expect(screen.getByText('#2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Print' }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('shows a pending state while preparing a reprint', async () => {
    const user = userEvent.setup();
    let resolveReceipt: (receipt: ReturnType<typeof makeReceipt>) => void = () => {};
    vi.mocked(printSaleReceipt).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReceipt = resolve;
        }),
    );
    renderDrawer();

    await screen.findByText('Receipt #1042');
    await user.click(screen.getByRole('button', { name: 'Reprint receipt' }));

    const reprint = screen.getByRole('button', { name: 'Reprint receipt' });
    await waitFor(() => expect(reprint).toBeDisabled());
    expect(reprint).toHaveTextContent('Preparing...');

    resolveReceipt(makeReceipt({ is_copy: true }));
    expect(await screen.findByTestId('receipt-view')).toBeInTheDocument();
  });

  it('closes the drawer', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    await screen.findByText('Receipt #1042');
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await user.click(closeButtons[closeButtons.length - 1]);

    expect(onOpenChange).toHaveBeenCalled();
    expect(vi.mocked(onOpenChange).mock.calls[0][0]).toBe(false);
  });
});
