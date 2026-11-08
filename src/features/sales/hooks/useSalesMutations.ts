import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

import { createSale, printSaleReceipt } from '../services/sales.service';
import type { CreateSalePayload } from '../types';
import { useInvalidateAudits } from '@/features/admin/hooks/useAdminMutations';

export function useCreateSale() {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
        invalidateAudits(),
      ]);
    },
  });
}

export function usePrintSaleReceipt() {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (saleId: string) => printSaleReceipt(saleId),
    onSuccess: (receipt) => {
      queryClient.setQueryData(queryKeys.sales.detail(receipt.sale.id), receipt.sale);
      invalidateAudits();
    },
  });
}
