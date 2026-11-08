import { dateTimeFormatter, formatNaira } from '@/features/admin/staff/utils';
import { cn } from '@/lib/utils';

import type { ReceiptResponse } from '../types';
import { paymentMethodLabel } from '../utils';

interface ReceiptViewProps {
  receipt: ReceiptResponse;
  className?: string;
}

/**
 * Print-friendly receipt shared by the post-sale dialog and the history
 * details drawer. Print styles live in index.css and only reveal `.print-receipt`.
 */
export function ReceiptView({ receipt, className }: ReceiptViewProps) {
  const { sale, store } = receipt;
  const method = sale.payment?.method ?? sale.payment_method;
  const account = sale.payment?.account_label;

  return (
    <article
      id="sale-receipt"
      data-testid="receipt-view"
      className={cn('print-receipt bg-card mx-auto w-full max-w-sm px-4 py-6 text-sm', className)}
    >
      <header className="flex flex-col items-center gap-1 border-b border-dashed pb-3 text-center">
        <h2 className="text-base font-semibold">{store.name}</h2>
        {store.address ? <p className="text-muted-foreground text-xs">{store.address}</p> : null}
        {store.phone ? <p className="text-muted-foreground text-xs">{store.phone}</p> : null}
      </header>

      {receipt.is_copy ? (
        <p
          data-testid="receipt-copy"
          className="border-foreground my-3 border-y border-dashed py-1 text-center text-xs font-semibold tracking-[0.3em] uppercase"
        >
          Copy
        </p>
      ) : null}

      <div className="flex flex-col gap-1 py-3 text-xs">
        <div className="flex justify-between gap-2">
          <span className="font-medium">Receipt #{sale.receipt_number}</span>
          <time dateTime={sale.created_at}>
            {dateTimeFormatter.format(new Date(sale.created_at))}
          </time>
        </div>
        <div className="text-muted-foreground flex justify-between gap-2">
          <span>Cashier</span>
          <span>{sale.staff_name}</span>
        </div>
      </div>

      <table className="w-full border-t border-dashed text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="py-2 text-left font-medium">Item</th>
            <th className="py-2 text-center font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((line) => (
            <tr key={line.id} className="border-dashed/60 border-t">
              <td className="py-1.5 pr-2">
                <span className="block">{line.name}</span>
                <span className="text-muted-foreground block font-mono text-[10px]">
                  {line.sku}
                </span>
                <span className="text-muted-foreground block text-[10px]">
                  {formatNaira(line.unit_price)} each
                </span>
              </td>
              <td className="py-1.5 text-center tabular-nums">{line.quantity}</td>
              <td className="py-1.5 text-right tabular-nums">{formatNaira(line.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between border-t border-dashed py-2 text-sm font-semibold">
        <span>Total</span>
        <span data-testid="receipt-total">{formatNaira(sale.total)}</span>
      </div>

      <div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
        <div className="flex justify-between gap-2">
          <span>Payment</span>
          <span>{paymentMethodLabel(method)}</span>
        </div>
        {account ? (
          <div className="flex justify-between gap-2">
            <span>Account</span>
            <span>{account}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <span>Print</span>
          <span>#{receipt.print_number}</span>
        </div>
      </div>

      {store.receipt_footer ? (
        <p className="mt-4 border-t border-dashed pt-3 text-center text-xs">
          {store.receipt_footer}
        </p>
      ) : null}
    </article>
  );
}
