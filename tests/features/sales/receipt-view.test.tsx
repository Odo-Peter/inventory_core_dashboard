import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReceiptView } from '@/features/sales/components/receipt-view';
import { formatNaira } from '@/features/admin/staff/utils';
import { makeReceipt, makeSale } from '../../helpers/sales';

describe('ReceiptView', () => {
  it('renders a print-friendly receipt with store, sale, and line details', () => {
    const receipt = makeReceipt();
    render(<ReceiptView receipt={receipt} />);

    const view = screen.getByTestId('receipt-view');
    expect(view).toHaveClass('print-receipt');
    expect(view).toHaveAttribute('id', 'sale-receipt');

    expect(within(view).getByRole('heading', { name: 'Test Store' })).toBeInTheDocument();
    expect(within(view).getByText('1 Main Street')).toBeInTheDocument();
    expect(within(view).getByText('Tel: +2348030000000')).toBeInTheDocument();
    expect(within(view).getByText('Thank you for your custom')).toBeInTheDocument();

    // The receipt layout now labels the number instead of using "Receipt #1042".
    expect(within(view).getByText('RECEIPT NO:')).toBeInTheDocument();
    expect(within(view).getByText(String(receipt.sale.receipt_number))).toBeInTheDocument();
    expect(within(view).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(view).getByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(within(view).getByText('SKU: SKU-001')).toBeInTheDocument();
    expect(within(view).getByText('Bottled Water 75cl')).toBeInTheDocument();

    expect(within(view).getByTestId('receipt-total')).toHaveTextContent(formatNaira(3800));

    // Lines are no longer table rows; each line still shows quantity, unit price, and total.
    const [cola] = receipt.sale.items;
    expect(
      within(view).getByText(`${cola.quantity} x ${formatNaira(cola.unit_price)}`),
    ).toBeInTheDocument();
    expect(within(view).getByText(formatNaira(cola.line_total))).toBeInTheDocument();
  });

  it('shows the payment method and account label from the payment record', () => {
    const receipt = makeReceipt({
      sale: makeSale({
        payment_method: 'card',
        payment: {
          id: 'payment-1',
          method: 'card',
          amount: 3800,
          pos_account_id: 'terminal-1',
          account_label: 'Terminal 1',
        },
      }),
    });
    render(<ReceiptView receipt={receipt} />);

    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Terminal 1')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('falls back to the sale payment method when the payment record is missing', () => {
    render(
      <ReceiptView
        receipt={makeReceipt({
          sale: makeSale({ payment: null, payment_method: 'bank_transfer' }),
        })}
      />,
    );

    expect(screen.getByText('Bank transfer')).toBeInTheDocument();
    expect(screen.queryByText('Account')).not.toBeInTheDocument();
  });

  it('marks a copy print', () => {
    render(<ReceiptView receipt={makeReceipt({ is_copy: true, print_number: 2 })} />);

    expect(screen.getByTestId('receipt-copy')).toHaveTextContent('Copy');
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('omits a copy banner on the original print', () => {
    render(<ReceiptView receipt={makeReceipt({ is_copy: false })} />);

    expect(screen.queryByTestId('receipt-copy')).not.toBeInTheDocument();
  });

  it('omits optional store details when they are not set', () => {
    render(
      <ReceiptView
        receipt={makeReceipt({
          store: {
            name: 'Bare Store',
            address: null,
            phone: null,
            currency: 'NGN',
            receipt_footer: null,
          },
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Bare Store' })).toBeInTheDocument();
    expect(screen.queryByText('1 Main Street')).not.toBeInTheDocument();
    expect(screen.queryByText('Thank you for your custom')).not.toBeInTheDocument();
  });
});
