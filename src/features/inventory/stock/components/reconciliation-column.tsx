import { Link } from 'react-router';
import { createColumnHelper } from '@tanstack/react-table';

import type { DataTableFeatures } from '@/components/shared/data-table';
import { cn } from '@/lib/utils';

import type { ReconciliationRow } from '../types';
import { formatSigned } from '../lib/movement-utils';

const columnHelper = createColumnHelper<DataTableFeatures, ReconciliationRow>();

export const getReconciliationColumns = () =>
  columnHelper.columns([
    columnHelper.display({
      id: 'item',
      header: 'Item',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.name}</span>
          <span className="text-muted-foreground font-mono text-[11px]">{row.original.sku}</span>
        </div>
      ),
    }),

    columnHelper.accessor('stock_quantity', {
      header: () => <span className="block text-right">Cached stock</span>,
      cell: (info) => (
        <span className="block text-right font-mono text-sm tabular-nums">{info.getValue()}</span>
      ),
    }),

    columnHelper.accessor('movement_total', {
      header: () => <span className="block text-right">Ledger total</span>,
      cell: (info) => (
        <span className="block text-right font-mono text-sm tabular-nums">{info.getValue()}</span>
      ),
    }),

    columnHelper.accessor('difference', {
      header: () => <span className="block text-right">Difference</span>,
      cell: (info) => (
        <span
          className={cn(
            'block text-right font-mono text-sm font-medium tabular-nums',
            info.getValue() > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive',
          )}
        >
          {formatSigned(info.getValue())}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'ledger',
      header: () => <span className="sr-only">Ledger</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            to={`/inventory/movements?item_id=${row.original.item_id}`}
            className="text-primary text-xs underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View ledger
          </Link>
        </div>
      ),
    }),
  ]);
