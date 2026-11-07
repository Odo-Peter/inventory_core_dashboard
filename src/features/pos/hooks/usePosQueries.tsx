import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

import type { ListPosAccountsQuery } from '../types';
import { getPosAccount, listPosAccounts } from '../service/pos.service';

export const useListPosAccounts = (params: ListPosAccountsQuery = {}) => {
  return useQuery({
    queryKey: queryKeys.posAccounts.list(params),
    queryFn: () => listPosAccounts(params),
  });
};

export const usePosAccount = (id: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.posAccounts.detail(id!),
    queryFn: () => getPosAccount(id!),
    enabled: !!id,
  });
};
