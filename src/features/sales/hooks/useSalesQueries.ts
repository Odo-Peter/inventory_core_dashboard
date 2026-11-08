import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { getItemByBarcode } from '@/features/inventory/category/services/category.service';
import { queryKeys } from '@/lib/query-keys';

import { getPaymentOptions, getSale, getSalesSummary, listSales } from '../services/sales.service';
import type { ListSalesQuery } from '../types';

export function useListSales(query: ListSalesQuery) {
  return useQuery({
    queryKey: queryKeys.sales.list(query),
    queryFn: () => listSales(query),
    placeholderData: keepPreviousData,
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id ?? ''),
    queryFn: () => getSale(id as string),
    enabled: Boolean(id),
  });
}

export function usePaymentOptions() {
  return useQuery({
    queryKey: queryKeys.sales.paymentOptions,
    queryFn: getPaymentOptions,
    staleTime: 60 * 1000,
  });
}

export function useSalesSummary(query: ListSalesQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sales.summary(query),
    queryFn: () => getSalesSummary(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * Barcode lookup is triggered imperatively on Enter, so it is exposed as a
 * mutation rather than a cached query.
 */
export function useBarcodeLookup() {
  return useMutation({
    mutationFn: (barcode: string) => getItemByBarcode(barcode),
  });
}
