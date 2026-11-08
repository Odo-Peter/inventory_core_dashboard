import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { MovementFiltersBar, type MovementFilters } from '../components/movement-filters';
import { MovementTable } from '../components/movement-table';
import { RecordMovementDrawer } from '../components/record-movement-drawer';
import { useListStockMovements } from '../hooks/useStockMovementQueries';
import { isReason, resolveRange } from '../lib/movement-utils';
import type { ListMovementsQuery } from '../types';
import { getMovementColumns } from '../components/movement-column';
import { Can } from '@/lib/rbac';

const PAGE_SIZE = 25;

function readFilters(p: URLSearchParams): MovementFilters {
  return {
    q: p.get('q') ?? '',
    reasons: (p.get('reason') ?? '').split(',').filter(isReason),
    from: p.get('from') ?? '',
    to: p.get('to') ?? '',
    item_id: p.get('item_id') ?? '',
  };
}

export function StockMovementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recordOpen, setRecordOpen] = useState(false);

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);

  // Anything other than the default range counts as an active filter
  const hasActiveFilters = Boolean(
    filters.q.trim() || filters.reasons.length || filters.item_id || filters.from || filters.to,
  );

  const query = useMemo<ListMovementsQuery>(() => {
    const { from, to } = resolveRange(filters.from, filters.to);
    return {
      page,
      page_size: PAGE_SIZE,
      ...(filters.q.trim() ? { search: filters.q.trim() } : {}),
      ...(filters.reasons.length ? { reason: filters.reasons } : {}),
      ...(filters.item_id ? { item_id: filters.item_id } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
  }, [page, filters]);

  const { data, isLoading, isFetching, isError, refetch } = useListStockMovements(query);
  const movements = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;

  // Name for the "Item: …" chip, taken from the loaded rows
  const itemName = filters.item_id
    ? movements.find((m: { item_id: string }) => m.item_id === filters.item_id)?.item_name
    : undefined;

  const handleFiltersChange = useCallback(
    (patch: Partial<MovementFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const set = (key: string, value: string) =>
            value ? next.set(key, value) : next.delete(key);

          if ('q' in patch) set('q', patch.q ?? '');
          if ('reasons' in patch) set('reason', (patch.reasons ?? []).join(','));
          if ('item_id' in patch) set('item_id', patch.item_id ?? '');
          if ('from' in patch) set('from', patch.from ?? '');
          if ('to' in patch) set('to', patch.to ?? '');

          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClear = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

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

  const handleFilterItem = useCallback(
    (itemId: string) => handleFiltersChange({ item_id: itemId }),
    [handleFiltersChange],
  );

  const columns = useMemo(
    () => getMovementColumns({ onFilterItem: handleFilterItem }),
    [handleFilterItem],
  );

  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'movement' : 'movements'}${hasActiveFilters ? ' matching filters' : ''}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stock Movements"
        description="Every change to your stock, newest first."
        actions={
          <Can permission="stockRecord">
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" />
              Record movement
            </Button>
          </Can>
        }
      />

      <MovementFiltersBar
        filters={filters}
        itemName={itemName}
        hasActiveFilters={hasActiveFilters}
        onChange={handleFiltersChange}
        onClear={handleClear}
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load movements</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <MovementTable
          columns={columns}
          movements={movements}
          meta={meta}
          description={description}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            hasActiveFilters ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  No movements match these filters
                </span>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear filters
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      <RecordMovementDrawer open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
}
