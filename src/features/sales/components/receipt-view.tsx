import { dateTimeFormatter, formatNaira } from '@/features/admin/staff/utils';
import { cn } from '@/lib/utils';

import type { ReceiptResponse } from '../types';
import { paymentMethodLabel } from '../utils';

interface ReceiptViewProps {
  receipt: ReceiptResponse;
  className?: string;
}

export function ReceiptView({ receipt, className }: ReceiptViewProps) {
  const { sale, store } = receipt;
  const method = sale.payment?.method ?? sale.payment_method;
  const account = sale.payment?.account_label;

  return (
    <article
      id="sale-receipt"
      data-testid="receipt-view"
      className={cn(
        'print-receipt mx-auto w-full max-w-[80mm] bg-white py-4 font-mono text-[11px] leading-snug text-black',
        className,
      )}
    >
      {/* Store information */}
      <header className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-base font-bold tracking-wide uppercase">{store.name}</h2>

        {store.address && <p className="max-w-full text-[10px]">{store.address}</p>}

        {store.phone && <p className="text-[10px]">Tel: {store.phone}</p>}
      </header>

      <div className="my-3 border-t border-dashed border-black" />

      {receipt.is_copy && (
        <p
          data-testid="receipt-copy"
          className="mb-2 text-center font-bold tracking-widest uppercase"
        >
          *** Copy ***
        </p>
      )}

      {/* Transaction information */}
      <section className="space-y-1">
        <div className="flex justify-between gap-2 font-bold">
          <span>RECEIPT NO:</span>
          <span className="text-right">{sale.receipt_number}</span>
        </div>

        <div className="flex justify-between gap-2">
          <span>Date:</span>
          <time dateTime={sale.created_at}>
            {dateTimeFormatter.format(new Date(sale.created_at))}
          </time>
        </div>

        <div className="flex justify-between gap-2">
          <span>Cashier:</span>
          <span className="text-right">{sale.staff_name}</span>
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-black" />

      {/* Purchased items */}
      <section>
        <div className="mb-2 grid grid-cols-[1fr_auto] gap-2 font-bold uppercase">
          <span>Description</span>
          <span>Amount</span>
        </div>

        <div className="space-y-3">
          {sale.items.map((line) => (
            <div key={line.id} className="break-inside-avoid">
              <p className="font-semibold wrap-break-word">{line.name}</p>

              {line.sku && <p className="text-[9px]">SKU: {line.sku}</p>}

              <div className="mt-0.5 flex justify-between gap-2 tabular-nums">
                <span>
                  {line.quantity} x {formatNaira(line.unit_price)}
                </span>
                <span className="text-right font-semibold">{formatNaira(line.line_total)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-black" />

      {/* Payment summary */}
      <section className="space-y-1">
        <div className="flex justify-between gap-2 text-sm font-bold">
          <span>TOTAL</span>
          <span data-testid="receipt-total" className="text-right tabular-nums">
            {formatNaira(sale.total)}
          </span>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="flex justify-between gap-2">
          <span>Payment method:</span>
          <span className="text-right">{paymentMethodLabel(method)}</span>
        </div>

        {account && (
          <div className="flex justify-between gap-2">
            <span>Account:</span>
            <span className="text-right">{account}</span>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <span>Print number:</span>
          <span>#{receipt.print_number}</span>
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-black" />

      {/* Footer */}
      <footer className="space-y-2 text-center">
        {store.receipt_footer && (
          <p className="wrap-break-word whitespace-pre-wrap">{store.receipt_footer}</p>
        )}

        <p className="font-bold tracking-wide uppercase">Thank you for your patronage!</p>

        <p className="text-[9px]">Please keep this receipt for your records.</p>
      </footer>
    </article>
  );
}
