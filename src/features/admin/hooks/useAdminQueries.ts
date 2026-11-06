import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getAuditActions,
  getAudits,
  getCurrentStore,
  getStaff,
  listStaff,
} from '../services/admin.service';
import { queryKeys } from '@/lib/query-keys';
import type { ListAuditsParams } from '@/features/audit/types';

export const useListStaff = () => {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: listStaff,
  });
};

export const useGetStaff = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: () => getStaff(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    retry: false,
  });
};

export const useGetCurrentStore = () => {
  return useQuery({
    queryKey: queryKeys.store.current,
    queryFn: getCurrentStore,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAudits = (params: ListAuditsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.audits.list(params),
    queryFn: () => getAudits(params),
    placeholderData: keepPreviousData,
  });
};

export const useAuditActions = () => {
  return useQuery({
    queryKey: queryKeys.auditActions,
    queryFn: getAuditActions,
    staleTime: 1000 * 60 * 60,
    select: (data) => data.actions,
  });
};
