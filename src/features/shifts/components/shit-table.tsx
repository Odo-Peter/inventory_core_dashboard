import { EyeIcon, MoreHorizontalIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import type { Shift } from '../types';
import { formatStaffDate, formatTime } from '@/features/admin/staff/utils';

function formatNaira(kobo: number | null | undefined) {
  if (kobo == null) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

function isShiftOpen(shift: Shift) {
  return !shift.clock_out_at;
}

interface ShiftTableProps {
  shifts: Shift[];
  isLoading?: boolean;
  skeletonRows?: number;
  onView: (shift: Shift) => void;
}

function ShiftTableSkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto size-8 rounded-md" />
      </TableCell>
    </TableRow>
  ));
}

function ShiftRowActions({ shift, onView }: { shift: Shift; onView: (shift: Shift) => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for shift ${shift.id}`}
            className="text-muted-foreground"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(shift)}>
          <EyeIcon />
          View shift details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ShiftTable({ shifts, onView, isLoading, skeletonRows = 5 }: ShiftTableProps) {
  const openCount = shifts.filter(isShiftOpen).length;
  const closedCount = shifts.length - openCount;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">All shifts</h2>
          <p className="text-muted-foreground text-xs">
            {shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'}
            {shifts.length > 0 ? ` · ${openCount} open · ${closedCount} closed` : ''}
          </p>
        </div>
      </div>

      <Table className="[&_td]:px-4 [&_th]:px-4">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Date
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Clock in
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Clock out
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Starting cash
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Closing cash
            </TableHead>
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <ShiftTableSkeletonRows rows={skeletonRows} />
          ) : shifts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                No shifts found.
              </TableCell>
            </TableRow>
          ) : (
            shifts.map((shift) => {
              const open = isShiftOpen(shift);
              return (
                <TableRow key={shift.id}>
                  <TableCell>
                    <Badge variant={open ? 'success' : 'secondary'}>
                      {open ? 'Open' : 'Closed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">
                    <time dateTime={shift.created_at}>{formatStaffDate(shift.created_at)}</time>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">
                    <time dateTime={shift.clock_in_at}>{formatTime(shift.clock_in_at)}</time>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">
                    {shift.clock_out_at ? (
                      <time dateTime={shift.clock_out_at}>{formatTime(shift.clock_out_at)}</time>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {formatNaira(shift.opening_float)}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {formatNaira(shift.closing_cash_counted)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ShiftRowActions shift={shift} onView={onView} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
