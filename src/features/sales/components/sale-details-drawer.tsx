import { useEffect, useState } from 'react';
import { PrinterIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { dateTimeFormatter, formatNaira } from '@/features/admin/staff/utils';

import { usePrintSaleReceipt } from '../hooks/useSalesMutations';
import { useSale } from '../hooks/useSalesQueries';
import type { ReceiptResponse } from '../types';
import { paymentMethodLabel } from '../utils';
import { ReceiptView } from './receipt-view';

interface SaleDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
}

export function SaleDetailsDrawer({ open, onOpenChange, saleId }: SaleDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">Sale details</SheetTitle>
          <SheetDescription>
            A read-only record of a completed sale. Sales cannot be edited or deleted.
          </SheetDescription>
        </SheetHeader>

        {open && saleId ? (
          <SaleDetails saleId={saleId} onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SaleDetails({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const { data: sale, isLoading, isError, refetch } = useSale(saleId);
  const printReceipt = usePrintSaleReceipt();
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);

  useEffect(() => {
    setReceipt(null);
  }, [saleId]);

  async function handleReprint() {
    try {
      const printed = await printReceipt.mutateAsync(saleId);
      setReceipt(printed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not prepare the receipt');
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium">Failed to load this sale</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-semibold">Receipt #{sale.receipt_number}</p>
            <time dateTime={sale.created_at} className="text-muted-foreground text-xs">
              {dateTimeFormatter.format(new Date(sale.created_at))}
            </time>
          </div>
          <Badge
            variant={
              sale.payment_method === 'cash'
                ? 'success'
                : sale.payment_method === 'card'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {paymentMethodLabel(sale.payment_method)}
          </Badge>
        </div>

        <section className="rounded-lg border">
          <h3 className="border-b px-3 py-2 text-xs font-medium">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase">Item</th>
                <th className="px-3 py-2 text-center text-[11px] font-medium uppercase">Qty</th>
                <th className="px-3 py-2 text-right text-[11px] font-medium uppercase">Unit</th>
                <th className="px-3 py-2 text-right text-[11px] font-medium uppercase">Line</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((line) => (
                <tr key={line.id} className="border-t">
                  <td className="px-3 py-2">
                    <span className="block font-medium">{line.name}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">{line.sku}</span>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{line.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNaira(line.unit_price)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatNaira(line.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border">
          <h3 className="border-b px-3 py-2 text-xs font-medium">Payment</h3>
          <dl className="grid grid-cols-2 gap-3 p-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Method</dt>
              <dd>{paymentMethodLabel(sale.payment_method)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Account</dt>
              <dd>{sale.payment?.account_label ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Staff</dt>
              <dd>{sale.staff_name}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Items</dt>
              <dd>{sale.item_count}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Subtotal
              </dt>
              <dd className="tabular-nums">{formatNaira(sale.subtotal)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Tax</dt>
              <dd className="tabular-nums">{formatNaira(sale.tax_total)}</dd>
            </div>
            <div className="col-span-2 flex items-center justify-between border-t pt-2">
              <dt className="font-medium">Total</dt>
              <dd className="text-lg font-semibold tabular-nums" data-testid="sale-total">
                {formatNaira(sale.total)}
              </dd>
            </div>
          </dl>
        </section>

        {receipt ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium">Reprint</h3>
            <ReceiptView receipt={receipt} className="border" />
          </section>
        ) : null}
      </div>

      <SheetFooter className="flex-row justify-end border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {receipt ? (
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <PrinterIcon />
            Print
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={handleReprint}
          disabled={printReceipt.isPending}
          aria-label="Reprint receipt"
        >
          {printReceipt.isPending ? (
            <>
              <Spinner className="size-4" />
              Preparing...
            </>
          ) : (
            'Reprint receipt'
          )}
        </Button>
      </SheetFooter>
    </>
  );
}
