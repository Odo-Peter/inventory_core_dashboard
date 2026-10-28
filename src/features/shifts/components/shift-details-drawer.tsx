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

import type { Shift } from '../types';
import { formatNaira, formatStaffDate, formatTime } from '@/features/admin/staff/utils';
import { useGetStaff } from '@/features/admin/hooks/useAdminQueries';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';

interface ShiftDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  principal?: { id: string; role?: string } | null;
  onEndShift?: (shift: Shift) => void;
  onAdminEndShift?: (shift: Shift) => void;
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

function isShiftOpen(shift: Shift) {
  return shift.clock_out_at == null;
}

function canEndShift(shift: Shift, principal?: { id: string; role?: string }): boolean {
  if (!isShiftOpen(shift) || !principal) return false;

  const isOwner = principal.id === shift.staff_id;
  const isManagerOrAdmin = principal.role === 'admin' || principal.role === 'manager';

  return isOwner || isManagerOrAdmin;
}

function isManagerOrAdmin(role?: string) {
  return role === 'admin' || role === 'manager';
}

function formatShiftDuration(clockIn: string, clockOut: string): string {
  const durationMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const totalMinutes = Math.floor(durationMs / 60_000);

  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export function ShiftDetailsDrawer({
  open,
  onOpenChange,
  shift,
  onEndShift,
  principal,
  onAdminEndShift,
}: ShiftDetailsDrawerProps) {
  const canLookupStaff = isManagerOrAdmin(principal?.role);

  const { data: staff, isError: staffLookupFailed } = useGetStaff(shift?.staff_id ?? '', {
    enabled: open && !!shift?.staff_id && canLookupStaff,
  });

  const { data: profile } = useMyProfile(
    open && !!shift && !!principal && shift.staff_id === principal.id,
  );

  const staffName = (() => {
    if (staff?.name) return staff.name;
    // Own shift: use profile (cashier-safe)
    if (shift && principal && shift.staff_id === principal.id) {
      return profile?.name ?? 'You';
    }
    if (staffLookupFailed || !canLookupStaff) return 'Staff member';
    return '…';
  })();

  const showEndShift =
    !!shift &&
    !!principal &&
    canEndShift(shift, principal) &&
    (typeof onEndShift === 'function' || typeof onAdminEndShift === 'function');

  const isForeignShift = !!shift && !!principal && shift.staff_id !== principal.id;

  const handleEndShift = () => {
    if (!shift) return;
    onOpenChange(false);

    // Admin/manager closing someone else's open shift → reason dialog
    if (isForeignShift && isManagerOrAdmin(principal?.role) && onAdminEndShift) {
      onAdminEndShift(shift);
      return;
    }

    // Own shift
    onEndShift?.(shift);
  };

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
              <Badge variant={isShiftOpen(shift) ? 'success' : 'secondary'}>
                {isShiftOpen(shift) ? 'Open' : 'Closed'}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Start{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {formatTime(shift.clock_in_at)}
                </span>
              </span>
              {shift.clock_out_at ? (
                <span className="text-muted-foreground text-sm">
                  End{' '}
                  <span className="text-foreground font-medium tabular-nums">
                    {formatTime(shift.clock_out_at)}
                  </span>
                </span>
              ) : null}
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
                <DetailItem label="Date">
                  <span className="tabular-nums">{formatStaffDate(shift.created_at, true)}</span>
                </DetailItem>
                <DetailItem label="Duration">
                  <span className="tabular-nums">
                    {shift.clock_out_at
                      ? formatShiftDuration(shift.clock_in_at, shift.clock_out_at)
                      : '—'}
                  </span>
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
                  <span className="capitalize">
                    {shift.close_reason?.trim() ? shift.close_reason : '—'}
                  </span>
                </DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Identifiers</h3>
              <dl className="grid grid-cols-1 gap-3 p-3">
                <DetailItem label="Staff name">
                  <span className="text-sm break-all">{staffName}</span>
                </DetailItem>
                <DetailItem label="Staff ID">
                  <span className="font-mono text-xs break-all">{shift.staff_id}</span>
                </DetailItem>
                <DetailItem label="Shift ID">
                  <span className="font-mono text-xs break-all">{shift.id}</span>
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
              Close
            </Button>
            {showEndShift ? (
              <Button type="button" variant="destructive" onClick={handleEndShift}>
                End shift
              </Button>
            ) : null}
          </SheetFooter>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
