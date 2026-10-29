import { createColumnHelper } from '@tanstack/react-table';
import { EyeIcon, MoreHorizontalIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableFeatures } from '@/components/shared/data-table';
import { formatNaira, formatStaffDate, formatTime } from '@/features/admin/staff/utils';
import type { Shift } from '@/features/shifts/types';

export const isShiftOpen = (shift: Shift) => !shift.clock_out_at;

const columnHelper = createColumnHelper<DataTableFeatures, Shift>();

export const getShiftColumns = (onView: (shift: Shift) => void) =>
  columnHelper.columns([
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const open = isShiftOpen(row.original);
        return <Badge variant={open ? 'success' : 'secondary'}>{open ? 'Open' : 'Closed'}</Badge>;
      },
    }),

    columnHelper.accessor('created_at', {
      header: 'Date',
      cell: (info) => (
        <time dateTime={info.getValue()} className="text-muted-foreground text-xs tabular-nums">
          {formatStaffDate(info.getValue())}
        </time>
      ),
    }),

    columnHelper.accessor('clock_in_at', {
      header: 'Clock in',
      cell: (info) => (
        <time dateTime={info.getValue()} className="text-muted-foreground text-xs tabular-nums">
          {formatTime(info.getValue())}
        </time>
      ),
    }),

    columnHelper.accessor('clock_out_at', {
      header: 'Clock out',
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <time dateTime={value} className="text-muted-foreground text-xs tabular-nums">
            {formatTime(value)}
          </time>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    }),

    columnHelper.accessor('opening_float', {
      header: 'Starting cash',
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="text-xs tabular-nums">{value === null ? '—' : formatNaira(value)}</span>
        );
      },
    }),

    columnHelper.accessor('closing_cash_counted', {
      header: 'Closing cash',
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="text-xs tabular-nums">{value === null ? '—' : formatNaira(value)}</span>
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for shift ${row.original.id}`}
                  className="text-muted-foreground"
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <EyeIcon />
                View shift details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ]);
