import { createColumnHelper } from '@tanstack/react-table';

import type { DataTableFeatures } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { dateTimeFormatter, formatNaira } from '@/features/admin/staff/utils';

import type { SaleListItem } from '../types';
import { paymentMethodLabel } from '../utils';

const columnHelper = createColumnHelper<DataTableFeatures, SaleListItem>();

export const getSaleColumns = () =>
  columnHelper.columns([
    columnHelper.accessor('receipt_number', {
      header: 'Receipt',
      cell: (info) => <span className="font-mono text-sm font-medium">#{info.getValue()}</span>,
    }),

    columnHelper.accessor('created_at', {
      header: 'When',
      cell: (info) => (
        <time
          dateTime={info.getValue()}
          title={info.getValue()}
          className="text-muted-foreground text-xs"
        >
          {dateTimeFormatter.format(new Date(info.getValue()))}
        </time>
      ),
    }),

    columnHelper.accessor('staff_name', {
      header: 'Staff',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),

    columnHelper.accessor('item_count', {
      header: 'Items',
      cell: (info) => {
        const count = info.getValue();
        return (
          <span className="text-sm tabular-nums">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: 'payment_method',
      header: 'Payment',
      cell: ({ row }) => {
        const method = row.original.payment_method;
        const variant = method === 'cash' ? 'success' : method === 'card' ? 'secondary' : 'outline';

        return <Badge variant={variant}>{paymentMethodLabel(method)}</Badge>;
      },
    }),

    columnHelper.accessor('total', {
      header: () => <span className="block text-right">Total</span>,
      cell: (info) => (
        <span className="block text-right text-sm font-medium tabular-nums">
          {formatNaira(info.getValue())}
        </span>
      ),
    }),
  ]);
