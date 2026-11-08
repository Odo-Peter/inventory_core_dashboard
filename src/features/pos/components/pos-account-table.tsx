import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';
import type { PosAccount } from '../types';

interface PosAccountTableProps {
  columns: DataTableColumnDef<PosAccount, any>[];
  accounts: PosAccount[];
  description?: React.ReactNode;
  isLoading?: boolean;
}

export function PosAccountTable({
  columns,
  accounts,
  description,
  isLoading,
}: PosAccountTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <DataTable
        data={accounts}
        columns={columns}
        isLoading={isLoading}
        showPagination
        emptyState={<span className="text-muted-foreground text-sm">No POS accounts found.</span>}
        persistHeaders
        headers
        headerProps={() => (
          <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">All POS accounts</h2>
              {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            </div>
          </div>
        )}
      />
    </div>
  );
}
