import { useEffect, useState } from 'react';
import {
  type ColumnDef,
  type RowData,
  type Table as TableInstance,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { ArrowLeft, ArrowRight, SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const features = tableFeatures({
  columnVisibilityFeature,
  rowSelectionFeature,
  rowPaginationFeature,
});

export type DataTableFeatures = typeof features;

export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

interface DataTableProps<TData extends Record<string, any>, TValue> {
  columns: DataTableColumnDef<TData, TValue>[];
  data: TData[];

  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;

  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  headers?: boolean;
  headerProps?: (table: TableInstance<DataTableFeatures, TData>) => React.ReactNode;
  emptyState?: React.ReactNode;

  isLoading?: boolean;
  isFetching?: boolean;
  persistHeaders?: boolean;
  loadingState?: React.ReactNode;

  onRowClick?: (row: TData) => void;
  meta?: Record<string, unknown>;
}

// const getPageWindow = (current: number, total: number) => {
//   if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
//   if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
//   if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
//   return [1, '...', current - 1, current, current + 1, '...', total];
// };

function DataTableSearch({
  value = '',
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (local === value) return;
    const timeout = setTimeout(() => onChange?.(local), 300);
    return () => clearTimeout(timeout);
  }, [local, value, onChange]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search..."
        aria-label="Search"
        className="pl-8"
      />
    </div>
  );
}

export function DataTable<TData extends Record<string, any>, TValue>({
  data,
  columns,
  headers,
  headerProps,
  emptyState,
  pageCount,
  page = 1,
  onPageChange,
  showPagination = true,
  showSearch = false,
  searchValue,
  onSearchChange,
  isLoading = false,
  isFetching = false, // ← new
  persistHeaders = false,
  loadingState,
  onRowClick,
  meta,
}: DataTableProps<TData, TValue>) {
  const table = useTable({
    features,
    data,
    columns: columns as ColumnDef<DataTableFeatures, TData, unknown>[],
    manualPagination: true,
    pageCount,
    meta,
  });

  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  const defaultLoadingState = (
    <Table className="[&_td]:px-4 [&_th]:px-4">
      <TableHeader className="bg-muted/40">
        <TableRow>
          {columns.map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-3 w-16" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i} aria-hidden="true">
            {columns.map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full max-w-24" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderTable = (showEmptyRow: boolean) => (
    <Table className="[&_td]:px-4 [&_th]:px-4">
      <TableHeader className="bg-muted/40">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className="text-muted-foreground text-[11px] tracking-wide uppercase"
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {hasRows ? (
          rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : showEmptyRow ? (
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="flex w-full items-center justify-center py-10">{emptyState}</div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );

  return (
    <div className="w-full">
      {headers && headerProps ? headerProps(table) : null}

      {showSearch && (
        <div className="mt-4">
          <DataTableSearch value={searchValue} onChange={onSearchChange} />
        </div>
      )}

      {/* Dim while refetching (same as old ShiftTable) */}
      <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
        {isLoading ? (
          (loadingState ?? defaultLoadingState)
        ) : persistHeaders ? (
          renderTable(true)
        ) : hasRows ? (
          renderTable(false)
        ) : (
          <div className="flex w-full items-center justify-center py-10">{emptyState}</div>
        )}
      </div>

      {showPagination && hasRows && (
        <div className="mt-0 flex w-full items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-xs tabular-nums">
            Page {page} of {pageCount ?? 1}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              <ArrowLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= (pageCount ?? 1) || isFetching}
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
