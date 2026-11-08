import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';

import type { ReconciliationRow } from '../types';
import type { PaginationMeta } from '@/lib/pagination';

interface ReconciliationTableProps {
  columns: DataTableColumnDef<ReconciliationRow, any>[];
  rows: ReconciliationRow[];
  meta?: PaginationMeta;
  description?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (row: ReconciliationRow) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function ReconciliationTable({
  columns,
  rows,
  meta,
  description,
  emptyState,
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: ReconciliationTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <DataTable
          data={rows}
          columns={columns}
          page={meta?.page}
          pageCount={meta?.total_pages}
          onPageChange={onPageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={emptyState}
          persistHeaders
          headers
          headerProps={() => (
            <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Items out of sync</h2>
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
