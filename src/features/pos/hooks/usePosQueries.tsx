import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useRoleEnabled } from '@/lib/rbac';

import type { ListPosAccountsQuery } from '../types';
import { getPosAccount, listPosAccounts } from '../service/pos.service';

export const useListPosAccounts = (params: ListPosAccountsQuery = {}) => {
  return useQuery({
    queryKey: queryKeys.posAccounts.list(params),
    queryFn: () => listPosAccounts(params),
    enabled: useRoleEnabled('posAccountsView'),
  });
};

export const usePosAccount = (id: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.posAccounts.detail(id!),
    queryFn: () => getPosAccount(id!),
    enabled: useRoleEnabled('posAccountsView', !!id),
  });
};
