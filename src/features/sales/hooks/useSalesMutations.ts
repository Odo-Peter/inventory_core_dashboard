import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

import { createSale, printSaleReceipt } from '../services/sales.service';

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: async () => {
      // A sale decrements stock, so the product grid must be refreshed too.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
      ]);
    },
  });
}

export function usePrintSaleReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: printSaleReceipt,
    onSuccess: (receipt) => {
      queryClient.setQueryData(queryKeys.sales.detail(receipt.sale.id), receipt.sale);
    },
  });
}
