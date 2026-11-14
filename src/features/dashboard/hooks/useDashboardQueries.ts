import { useQuery } from '@tanstack/react-query';

import { getSalesOverview } from '@/features/sales/services/sales.service';
import { queryKeys } from '@/lib/query-keys';
import { useRoleEnabled } from '@/lib/rbac';

/** Dashboard sales overview. Refetches in the background when the window regains focus. */
export function useSalesOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: getSalesOverview,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: useRoleEnabled('salesOverview'),
  });
}
