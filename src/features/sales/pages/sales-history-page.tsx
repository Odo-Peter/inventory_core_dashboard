import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { getSaleColumns } from '../column/sale-columns';
import {
  SALE_FILTER_PARAM,
  readSalesFilters,
  toSalesParams,
  type SalesFilters,
} from '../components/filters';
import { SaleDetailsDrawer } from '../components/sale-details-drawer';
import { SalesFiltersBar } from '../components/sales-filters';
import { SalesTable } from '../components/sales-table';
import { useListSales } from '../hooks/useSalesQueries';
import { useCan } from '@/lib/rbac';

const PAGE_SIZE = 25;
const PAGE_DESCRIPTION =
  'Completed sales, newest first. Sales are immutable: they cannot be edited or deleted.';

export function SalesHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filters = useMemo(() => readSalesFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const query = useMemo(() => toSalesParams(filters, page, PAGE_SIZE), [filters, page]);

  const { data, isLoading, isFetching, isError, refetch } = useListSales(query);

  // Cashiers see only their own sales; managers and admins see the store.
  const salesOwnScope = useCan('salesOwnScope');

  const sales = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? sales.length;

  const columns = useMemo(() => getSaleColumns(), []);

  const handleFiltersChange = useCallback(
    (patch: Partial<SalesFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const param = SALE_FILTER_PARAM[key as keyof SalesFilters];
            if (value) next.set(param, value);
            else next.delete(param);
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.values(SALE_FILTER_PARAM).forEach((param) => next.delete(param));
        next.delete('page');
        return next;
      },
      { replace: true },
    );
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

  useEffect(() => {
    if (meta && meta.total_pages > 0 && page > meta.total_pages) {
      handlePageChange(meta.total_pages);
    }
  }, [meta, page, handlePageChange]);

  const handleRowClick = (sale: { id: string }) => {
    setSelectedSaleId(sale.id);
    setDetailsOpen(true);
  };

  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'sale' : 'sales'}${hasActiveFilters ? ' matching filters' : ''}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Sales History" description={PAGE_DESCRIPTION} />

      {salesOwnScope ? (
        <div
          role="status"
          className="border-border bg-muted/40 text-muted-foreground rounded-lg border px-4 py-2 text-xs"
        >
          Showing your sales only. Managers and admins can see the whole store.
        </div>
      ) : null}

      <SalesFiltersBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load sales</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <SalesTable
          columns={columns}
          sales={sales}
          meta={meta}
          description={description}
          onRowClick={handleRowClick}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyState={
            hasActiveFilters ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-muted-foreground text-sm">No sales match these filters</span>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      <SaleDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} saleId={selectedSaleId} />
    </div>
  );
}
