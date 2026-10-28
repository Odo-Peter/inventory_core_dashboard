import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';

import type { AuditLog } from '../types';

interface AuditTableProps {
  columns: DataTableColumnDef<AuditLog, any>[];
  events: AuditLog[];
  meta?: { page: number; page_size: number; total: number; total_pages: number };
  description?: React.ReactNode;
  emptyState?: React.ReactNode;
  onRowClick?: (event: AuditLog) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function AuditTable({
  columns,
  events,
  meta,
  description,
  emptyState,
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: AuditTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <DataTable
          data={events}
          columns={columns}
          page={meta?.page}
          pageCount={meta?.total_pages}
          onPageChange={onPageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            emptyState ?? <span className="text-muted-foreground text-sm">No audit events yet</span>
          }
          persistHeaders
          headers
          headerProps={() => (
            <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Events</h2>
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
