import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';
import type { Staff } from '../types';

interface StaffTableProps {
  columns: DataTableColumnDef<Staff, any>[];
  staff: Staff[];
  description?: React.ReactNode;
  isLoading?: boolean;
}

export function StaffTable({ columns, staff, description, isLoading }: StaffTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <DataTable
        data={staff}
        columns={columns}
        isLoading={isLoading}
        showPagination
        emptyState={<span className="text-muted-foreground text-sm">No staff members found.</span>}
        persistHeaders
        headers
        headerProps={() => (
          <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">All staff</h2>
              {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            </div>
          </div>
        )}
      />
    </div>
  );
}
