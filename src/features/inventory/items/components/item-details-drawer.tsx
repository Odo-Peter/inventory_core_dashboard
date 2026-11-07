import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatNaira, formatStaffDate } from '@/features/admin/staff/utils';

import type { ItemResponse } from '../types';

interface ItemDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemResponse | null;
  categoryName?: string;
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

export function ItemDetailsDrawer({
  open,
  onOpenChange,
  item,
  categoryName,
}: ItemDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {item ? (
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="font-semibold">Item details</SheetTitle>
            <SheetDescription>
              Inventory, pricing, and status information for this item.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={item.active ? 'success' : 'secondary'}>
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
              {item.stock_quantity <= item.reorder_threshold && (
                <Badge variant="inactive">Low stock</Badge>
              )}
            </div>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Overview</h3>
              <dl className="grid grid-cols-2 gap-3 p-3">
                <DetailItem label="Name">{item.name}</DetailItem>
                <DetailItem label="SKU">{item.sku}</DetailItem>
                <DetailItem label="Barcode">{item.barcode || '—'}</DetailItem>
                <DetailItem label="Category">{categoryName || 'Uncategorized'}</DetailItem>
                <DetailItem label="Unit">{item.unit}</DetailItem>
                <DetailItem label="Status">{item.active ? 'Active' : 'Inactive'}</DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Pricing and stock</h3>
              <dl className="grid grid-cols-2 gap-3 p-3">
                <DetailItem label="Current price">{formatNaira(item.current_price)}</DetailItem>
                <DetailItem label="Cost price">
                  {item.cost_price == null ? '—' : formatNaira(item.cost_price)}
                </DetailItem>
                <DetailItem label="Stock quantity">
                  {item.stock_quantity} {item.unit}(s)
                </DetailItem>
                <DetailItem label="Reorder threshold">{item.reorder_threshold}</DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Timestamps and identifiers</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Date created">
                  <time dateTime={item.created_at}>{formatStaffDate(item.created_at, true)}</time>
                </DetailItem>
                <DetailItem label="Last updated">
                  <time dateTime={item.updated_at}>{formatStaffDate(item.updated_at, true)}</time>
                </DetailItem>
                <DetailItem label="Item ID">
                  <span className="font-mono text-xs">{item.id}</span>
                </DetailItem>
                <DetailItem label="Store ID">
                  <span className="font-mono text-xs">{item.store_id}</span>
                </DetailItem>
              </dl>
            </section>
          </div>

          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
