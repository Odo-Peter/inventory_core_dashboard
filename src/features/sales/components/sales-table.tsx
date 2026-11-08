import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';

import type { SaleListItem } from '../types';

interface SalesTableProps {
  columns: DataTableColumnDef<SaleListItem, any>[];
  sales: SaleListItem[];
  meta?: { page: number; page_size: number; total: number; total_pages: number };
  description?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (sale: SaleListItem) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function SalesTable({
  columns,
  sales,
  meta,
  description,
  emptyState,
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: SalesTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <DataTable
          data={sales}
          columns={columns}
          page={meta?.page}
          pageCount={meta?.total_pages}
          onPageChange={onPageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            emptyState ?? <span className="text-muted-foreground text-sm">No sales yet</span>
          }
          persistHeaders
          headers
          headerProps={() => (
            <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Sales</h2>
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
