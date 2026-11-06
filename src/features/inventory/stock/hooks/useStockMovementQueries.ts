import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListMovementsQuery, ListReconciliationQuery } from '../types';
import { getStockStatus, listReconciliation, listStockMovements } from '../services/stock.service';
import { queryKeys } from '@/lib/query-keys';

export function useListStockMovements(query: ListMovementsQuery) {
  return useQuery({
    queryKey: queryKeys.movementKeys.list(query),
    queryFn: () => listStockMovements(query),
    placeholderData: keepPreviousData,
  });
}

export function useItemStockStatus(itemId: string | null) {
  return useQuery({
    queryKey: queryKeys.movementKeys.status(itemId ?? ''),
    queryFn: () => getStockStatus(itemId as string),
    enabled: !!itemId,
  });
}

export function useListReconciliation(query: ListReconciliationQuery) {
  return useQuery({
    queryKey: queryKeys.reconciliationKeys.list(query),
    queryFn: () => listReconciliation(query),
    placeholderData: keepPreviousData,
  });
}

/** Count only, for a nav badge. Cached for a few minutes because the query scans the ledger. */
export function useReconciliationDriftCount(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reconciliationKeys.all, 'count'] as const,
    queryFn: () => listReconciliation({ page: 1, page_size: 1 }),
    select: (res) => res.meta.total,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
