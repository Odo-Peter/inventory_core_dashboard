import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordMovement } from '../services/stock.service';
import { useInvalidateAudits } from '@/features/admin/hooks/useAdminMutations';

export function useRecordMovement() {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: recordMovement,
    onSuccess: async (_movement, { itemId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.movementKeys.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.movementKeys.status(itemId) }),
        // stock_quantity is shown on the products page. Replace with your real
        // item query key (from useCategoryQueries) if it isn't ['items'].
        queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        invalidateAudits(),
      ]);
    },
  });
}
