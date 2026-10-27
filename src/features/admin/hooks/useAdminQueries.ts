import { useQuery } from '@tanstack/react-query';
import { getCurrentStore, getStaff, listStaff } from '../services/admin.service';
import { queryKeys } from '@/lib/query-keys';

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
  });
};
