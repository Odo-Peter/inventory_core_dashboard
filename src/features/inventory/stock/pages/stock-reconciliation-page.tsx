import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle2, RefreshCw } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { ReconciliationTable } from '../components/reconciliation-table';
import { useListReconciliation } from '../hooks/useStockMovementQueries';
import { getReconciliationColumns } from '../components/reconciliation-column';
import type { ListReconciliationQuery } from '../types';

const PAGE_SIZE = 25;

export function StockReconciliationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);

  const query = useMemo<ListReconciliationQuery>(() => ({ page, page_size: PAGE_SIZE }), [page]);
  const { data, isLoading, isFetching, isError, refetch } = useListReconciliation(query);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const columns = useMemo(() => getReconciliationColumns(), []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) next.delete('page');
        else next.set('page', String(nextPage));
        return next;
      });
    },
    [setSearchParams],
  );

  // Step back if the last page empties out after a refresh
  useEffect(() => {
    if (meta && meta.total_pages > 0 && page > meta.total_pages) {
      handlePageChange(meta.total_pages);
    }
  }, [meta, page, handlePageChange]);

  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'item' : 'items'} where cached stock differs from the ledger`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stock Reconciliation"
        description="Finds items whose stock count no longer matches the sum of their stock movements."
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Re-check
          </Button>
        }
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to run the reconciliation check</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <ReconciliationTable
          columns={columns}
          rows={rows}
          meta={meta}
          description={description}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="size-6 text-emerald-600" />
              <span className="text-sm font-medium">Ledger and stock counts agree</span>
              <span className="text-muted-foreground text-xs">
                No items have drifted from their movement history.
              </span>
            </div>
          }
        />
      )}
    </div>
  );
}
