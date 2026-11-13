import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ReceiptDialog } from '@/features/sales/components/receipt-dialog';
import { makeReceipt } from '../../helpers/sales';

function renderDialog({
  open = true,
  receipt = makeReceipt(),
  onOpenChange = vi.fn(),
  onNewSale = vi.fn(),
}: {
  open?: boolean;
  receipt?: ReturnType<typeof makeReceipt> | null;
  onOpenChange?: (open: boolean) => void;
  onNewSale?: () => void;
} = {}) {
  render(
    <ReceiptDialog
      open={open}
      onOpenChange={onOpenChange}
      receipt={receipt}
      onNewSale={onNewSale}
    />,
  );

  return { onOpenChange, onNewSale };
}

describe('ReceiptDialog', () => {
  it('shows the receipt after a sale', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Receipt' });
    expect(dialog).toHaveTextContent('The sale is recorded.');
    expect(screen.getByTestId('receipt-view')).toBeInTheDocument();
    // The receipt layout now labels the number instead of using "Receipt #1042".
    expect(screen.getByText('RECEIPT NO:')).toBeInTheDocument();
    expect(screen.getByText('1042')).toBeInTheDocument();
  });

  it('prints the receipt', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Print' }));

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('closes and starts a new sale', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onNewSale } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'New sale' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onNewSale).toHaveBeenCalledTimes(1);
  });

  it('disables printing when there is no receipt yet', () => {
    renderDialog({ receipt: null });

    expect(screen.getByRole('button', { name: 'Print' })).toBeDisabled();
    expect(screen.queryByTestId('receipt-view')).not.toBeInTheDocument();
  });
});
