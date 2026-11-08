import { Link } from 'react-router';
import { createColumnHelper } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import type { DataTableFeatures } from '@/components/shared/data-table';
import { dateTimeFormatter } from '@/features/admin/staff/utils';
import { cn } from '@/lib/utils';

import type { StockMovement } from '../types';
import { REASON_META, formatSigned } from '../lib/movement-utils';

const columnHelper = createColumnHelper<DataTableFeatures, StockMovement>();

interface MovementColumnHandlers {
  onFilterItem: (itemId: string) => void;
}

export const getMovementColumns = ({ onFilterItem }: MovementColumnHandlers) =>
  columnHelper.columns([
    columnHelper.accessor('created_at', {
      header: 'When',
      cell: (info) => (
        <time
          dateTime={info.getValue()}
          title={info.getValue()}
          className="text-muted-foreground text-xs whitespace-nowrap"
        >
          {dateTimeFormatter.format(new Date(info.getValue()))}
        </time>
      ),
    }),

    columnHelper.display({
      id: 'item',
      header: 'Item',
      cell: ({ row }) => {
        const { item_id, item_name, item_sku } = row.original;

        return (
          <button
            type="button"
            title="Show only this item"
            className="flex flex-col text-left hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onFilterItem(item_id);
            }}
          >
            <span className="text-sm font-medium">{item_name}</span>
            <span className="text-muted-foreground font-mono text-[11px]">{item_sku}</span>
          </button>
        );
      },
    }),

    columnHelper.accessor('reason', {
      header: 'Type',
      cell: (info) => {
        const meta = REASON_META[info.getValue()];

        return (
          <Badge variant="secondary" className={meta.className}>
            {meta.label}
          </Badge>
        );
      },
    }),

    columnHelper.accessor('quantity_change', {
      header: () => <span className="block text-right">Change</span>,
      cell: (info) => {
        const value = info.getValue();

        return (
          <span
            className={cn(
              'block text-right font-mono text-sm font-medium tabular-nums',
              value > 0 && 'text-emerald-600 dark:text-emerald-400',
              value < 0 && 'text-destructive',
            )}
          >
            {formatSigned(value)}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: 'staff',
      header: 'By',
      cell: ({ row }) =>
        row.original.staff_name ? (
          <span className="text-sm whitespace-nowrap">{row.original.staff_name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">System</span>
        ),
    }),

    columnHelper.display({
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => {
        const { sale_id, refund_id } = row.original;

        // Adjust these links to wherever sales and refunds are viewable
        if (sale_id) {
          return (
            <Link
              to={`/sales?sale_id=${sale_id}`}
              title={sale_id}
              className="text-primary font-mono text-xs underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Sale #{sale_id.slice(0, 8)}
            </Link>
          );
        }

        if (refund_id) {
          return (
            <span title={refund_id} className="text-muted-foreground font-mono text-xs">
              Refund #{refund_id.slice(0, 8)}
            </span>
          );
        }

        return <span className="text-muted-foreground text-sm">n/a</span>;
      },
    }),

    columnHelper.accessor('note', {
      header: 'Note',
      cell: (info) => {
        const note = info.getValue();

        return note ? (
          <span title={note} className="block max-w-56 truncate text-sm">
            {note}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">n/a</span>
        );
      },
    }),
  ]);
