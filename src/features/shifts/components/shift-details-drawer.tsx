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

import type { ShiftStartResponse } from '../types';
import { formatNaira, formatTime } from '@/features/admin/staff/utils';

interface ShiftDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: ShiftStartResponse | null;
  onEndShift?: () => void;
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

export function ShiftDetailsDrawer({
  open,
  onOpenChange,
  shift,
  onEndShift,
}: ShiftDetailsDrawerProps) {
  const isOpen = shift && !shift.clock_out_at;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {shift ? (
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="font-semibold">Shift details</SheetTitle>
            <SheetDescription>
              Start time, starting cash, and other details for this shift.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-center gap-2">
              <Badge variant={isOpen ? 'success' : 'secondary'}>{isOpen ? 'Open' : 'Closed'}</Badge>
              <span className="text-muted-foreground text-sm">
                Since{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {formatTime(shift.clock_in_at)}
                </span>
              </span>
            </div>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Timing</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Clock in">
                  <span className="tabular-nums">{formatTime(shift.clock_in_at)}</span>
                </DetailItem>
                <DetailItem label="Clock out">
                  <span className="tabular-nums">
                    {shift.clock_out_at ? formatTime(shift.clock_out_at) : '—'}
                  </span>
                </DetailItem>
                <DetailItem label="Created">
                  <span className="tabular-nums">{formatTime(shift.created_at)}</span>
                </DetailItem>
                <DetailItem label="Updated">
                  <span className="tabular-nums">{formatTime(shift.updated_at)}</span>
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Cash</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Starting cash">{formatNaira(shift.opening_float)}</DetailItem>
                <DetailItem label="Closing cash counted">
                  {formatNaira(shift.closing_cash_counted ?? 0)}
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Notes</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Opening notes">
                  {shift.opening_notes?.trim() ? shift.opening_notes : '—'}
                </DetailItem>
                <DetailItem label="Closing notes">
                  {shift.closing_notes?.trim() ? shift.closing_notes : '—'}
                </DetailItem>
                <DetailItem label="Close reason">
                  {shift.close_reason?.trim() ? shift.close_reason : '—'}
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Identifiers</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Shift ID">
                  <span className="font-mono text-xs break-all">{shift.id}</span>
                </DetailItem>
                <DetailItem label="Staff ID">
                  <span className="font-mono text-xs break-all">{shift.staff_id}</span>
                </DetailItem>
                <DetailItem label="Store ID">
                  <span className="font-mono text-xs break-all">{shift.store_id}</span>
                </DetailItem>
                <DetailItem label="Closed by">
                  <span className="font-mono text-xs break-all">
                    {shift.closed_by_staff_id ?? '—'}
                  </span>
                </DetailItem>
              </dl>
            </section>
          </div>

          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onEndShift?.();
              }}
            >
              End shift
            </Button>
          </SheetFooter>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
