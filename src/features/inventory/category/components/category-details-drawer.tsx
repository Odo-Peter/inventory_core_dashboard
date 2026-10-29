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

import type { CategoryResponse } from '../types';
import { formatStaffDate } from '@/features/admin/staff/utils';

interface CategoryDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryResponse | null;
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function CategoryDetailsDrawer({
  open,
  onOpenChange,
  category,
}: CategoryDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {category ? (
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="font-semibold">Category details</SheetTitle>
            <SheetDescription>
              Information about this product category and its current status.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <Badge variant={category.active ? 'success' : 'secondary'}>
                {category.active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm font-medium">{category.name}</span>
            </div>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Overview</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Category name">{category.name}</DetailItem>
                <DetailItem label="Status">
                  <Badge variant={category.active ? 'success' : 'secondary'}>
                    {category.active ? 'Active' : 'Inactive'}
                  </Badge>
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Timestamps</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Date created">
                  <time dateTime={category.created_at} className="tabular-nums">
                    {formatStaffDate(category.created_at, true)}
                  </time>
                </DetailItem>
                <DetailItem label="Last updated">
                  <time dateTime={category.updated_at} className="tabular-nums">
                    {formatStaffDate(category.updated_at, true)}
                  </time>
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Identifiers</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Category ID">
                  <span className="font-mono text-xs break-all">{category.id}</span>
                </DetailItem>
                <DetailItem label="Store ID">
                  <span className="font-mono text-xs break-all">{category.store_id}</span>
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
