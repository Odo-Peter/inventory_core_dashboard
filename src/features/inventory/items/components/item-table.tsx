import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';
import type { PaginationMeta } from '@/lib/pagination';
import type { ItemResponse } from '../types';

interface ItemTableProps {
  columns: DataTableColumnDef<ItemResponse, any>[];
  items: ItemResponse[];
  meta?: PaginationMeta;
  description?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: ItemResponse) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function ItemTable({
  columns,
  items,
  meta,
  description,
  emptyMessage = 'No items found.',
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: ItemTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <DataTable
        data={items}
        columns={columns}
        page={meta?.page}
        pageCount={meta?.total_pages}
        onPageChange={onPageChange}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={<span className="text-muted-foreground text-sm">{emptyMessage}</span>}
        persistHeaders
        headers
        headerProps={() => (
          <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">All items</h2>
              {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            </div>
          </div>
        )}
        onRowClick={onRowClick}
      />
    </div>
  );
}
