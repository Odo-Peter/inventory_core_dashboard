import { DataTable, type DataTableColumnDef } from '@/components/shared/data-table';
import type { CategoryResponse } from '../types';
import type { PaginationMeta } from '@/lib/pagination';

interface CategoryTableProps {
  columns: DataTableColumnDef<CategoryResponse, any>[];
  categories: CategoryResponse[];
  meta?: PaginationMeta;
  title?: string;
  description?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (category: CategoryResponse) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function CategoryTable({
  columns,
  categories,
  meta,
  title = 'All categories',
  description,
  emptyMessage = 'No categories found.',
  onRowClick,
  onPageChange,
  isLoading,
  isFetching,
}: CategoryTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <DataTable
        data={categories}
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
              <h2 className="text-sm font-medium">{title}</h2>
              {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            </div>
          </div>
        )}
        onRowClick={onRowClick}
      />
    </div>
  );
}
