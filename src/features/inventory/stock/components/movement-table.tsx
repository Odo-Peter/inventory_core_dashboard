import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';

import type { StockMovement } from '../types';
import type { PaginationMeta } from '@/lib/pagination';

interface MovementTableProps {
  columns: DataTableColumnDef<StockMovement, any>[];
  movements: StockMovement[];
  meta?: PaginationMeta;
  description?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (movement: StockMovement) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function MovementTable({
  columns,
  movements,
  meta,
  description,
  emptyState,
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: MovementTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <DataTable
          data={movements}
          columns={columns}
          page={meta?.page}
          pageCount={meta?.total_pages}
          onPageChange={onPageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            emptyState ?? (
              <span className="text-muted-foreground text-sm">No stock movements yet</span>
            )
          }
          persistHeaders
          headers
          headerProps={() => (
            <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Movements</h2>
                {description ? (
                  <p className="text-muted-foreground text-xs">{description}</p>
                ) : null}
              </div>
            </div>
          )}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
}
