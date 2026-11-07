import { createColumnHelper } from '@tanstack/react-table';
import {
  EyeIcon,
  HistoryIcon,
  ImageIcon,
  ImageOffIcon,
  MoreHorizontalIcon,
  PackagePlusIcon,
  PencilIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
} from 'lucide-react';

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
import { formatNaira, formatStaffDate } from '@/features/admin/staff/utils';

import type { ItemResponse } from '../types';
import { Link } from 'react-router';

export interface ItemColumnActions {
  onView: (item: ItemResponse) => void;
  onEdit: (item: ItemResponse) => void;
  onChangePrice: (item: ItemResponse) => void;
  onRecordStock: (item: ItemResponse) => void;
  onDeactivate: (item: ItemResponse) => void;
  onReactivate: (item: ItemResponse) => void;
  onChangeImage: (item: ItemResponse) => void;
  onRemoveImage: (item: ItemResponse) => void;
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

      <DropdownMenuContent align="end" className="w-max min-w-52">
        <DropdownMenuItem onClick={() => actions.onView(item)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(item)}>
          <PencilIcon />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onChangePrice(item)}>
          <TagIcon />
          Change price
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onRecordStock(item)}>
          <PackagePlusIcon />
          Record stock movement
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to={`/inventory/movements?item_id=${item.id}`} />}>
          <HistoryIcon />
          View stock history
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onChangeImage(item)}>
          <ImageIcon />
          {item.image_key ? 'Replace image' : 'Add image'}
        </DropdownMenuItem>
        {item.image_key && (
          <DropdownMenuItem onClick={() => actions.onRemoveImage(item)}>
            <ImageOffIcon />
            Remove image
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {item.active ? (
          <DropdownMenuItem variant="destructive" onClick={() => actions.onDeactivate(item)}>
            <Trash2Icon />
            Deactivate item
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => actions.onReactivate(item)}>
            <RotateCcwIcon />
            Reactivate item
          </DropdownMenuItem>
        )}
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
      cell: (info) => <span className="text-sm tabular-nums">{formatNaira(info.getValue())}</span>,
    }),

    columnHelper.accessor('stock_quantity', {
      header: 'Stock',
      cell: ({ row }) => {
        const item = row.original;
        const lowStock =
          item.reorder_threshold > 0 && item.stock_quantity <= item.reorder_threshold;

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
