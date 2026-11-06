import { createColumnHelper } from '@tanstack/react-table';
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import type { DataTableFeatures } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatStaffDate } from '@/features/admin/staff/utils';

import type { ItemResponse } from '../types';

export interface ItemColumnActions {
  onView: (item: ItemResponse) => void;
  onEdit: (item: ItemResponse) => void;
  onDeactivate: (item: ItemResponse) => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, ItemResponse>();

function ItemRowActions({ item, actions }: { item: ItemResponse; actions: ItemColumnActions }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for item ${item.name}`}
            className="text-muted-foreground"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => actions.onView(item)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(item)}>
          <PencilIcon />
          Edit Item
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => actions.onDeactivate(item)}>
          <Trash2Icon />
          Deactivate Item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const getItemColumns = (
  actions: ItemColumnActions,
  categoryNames: Record<string, string> = {},
) =>
  columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'Item',
      cell: (info) => (
        <div className="flex min-w-32 flex-col gap-0.5">
          <span className="text-sm font-medium">{info.getValue()}</span>
          <span className="text-muted-foreground font-mono text-xs">{info.row.original.sku}</span>
        </div>
      ),
    }),

    columnHelper.accessor('category_id', {
      header: 'Category',
      cell: (info) => {
        const categoryId = info.getValue();

        return (
          <span className="text-muted-foreground text-sm">
            {categoryId ? (categoryNames[categoryId] ?? 'Unknown category') : 'Uncategorized'}
          </span>
        );
      },
    }),

    columnHelper.accessor('current_price', {
      header: 'Price',
      cell: (info) => (
        <span className="text-sm tabular-nums">{info.getValue().toLocaleString()}</span>
      ),
    }),

    columnHelper.accessor('stock_quantity', {
      header: 'Stock',
      cell: ({ row }) => {
        const item = row.original;
        const lowStock = item.stock_quantity <= item.reorder_threshold;

        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm tabular-nums">
              {item.stock_quantity} {item.unit}
            </span>
            {lowStock && <Badge variant="inactive">Low stock</Badge>}
          </div>
        );
      },
    }),

    columnHelper.accessor('active', {
      header: 'Status',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'success' : 'secondary'}>
          {info.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),

    columnHelper.accessor('updated_at', {
      header: 'Last updated',
      cell: (info) => (
        <time dateTime={info.getValue()} className="text-muted-foreground text-xs tabular-nums">
          {formatStaffDate(info.getValue())}
        </time>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right" onClick={(event) => event.stopPropagation()}>
          <ItemRowActions item={row.original} actions={actions} />
        </div>
      ),
    }),
  ]);
