import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

import type { PosAccount } from '../types';
import { formatStaffDateTime } from '@/features/admin/staff/utils';

interface PosAccountDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: PosAccount | null;
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

export function PosAccountDetailsDrawer({
  open,
  onOpenChange,
  account,
}: PosAccountDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {account ? (
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="font-semibold">POS account details</SheetTitle>
            <SheetDescription>Configuration and status for this POS account.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              <p className="truncate text-lg font-semibold">{account.label}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="capitalize">
                  {account.type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={account.active ? 'success' : 'inactive'}>
                  {account.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">General</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Label">{account.label}</DetailItem>
                <DetailItem label="Type">
                  <span className="capitalize">{account.type.replace(/_/g, ' ')}</span>
                </DetailItem>
                <DetailItem label="Status">{account.active ? 'Active' : 'Inactive'}</DetailItem>
                <DetailItem label="Created">{formatStaffDateTime(account.created_at)}</DetailItem>
                <DetailItem label="Updated">{formatStaffDateTime(account.updated_at)}</DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Identifiers</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Account ID">
                  <span className="font-mono text-xs break-all">{account.id}</span>
                </DetailItem>
                <DetailItem label="Store ID">
                  <span className="font-mono text-xs break-all">{account.store_id}</span>
                </DetailItem>
                {account.created_by_staff_id && (
                  <DetailItem label="Created by staff">
                    <span className="font-mono text-xs break-all">
                      {account.created_by_staff_id}
                    </span>
                  </DetailItem>
                )}
              </dl>
            </section>

            {Object.keys(account.details ?? {}).length > 0 && (
              <section className="rounded-lg border">
                <h3 className="border-b px-3 py-2 text-xs font-medium">Details</h3>
                <pre className="overflow-x-auto p-3 text-xs">
                  {JSON.stringify(account.details, null, 2)}
                </pre>
              </section>
            )}
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
