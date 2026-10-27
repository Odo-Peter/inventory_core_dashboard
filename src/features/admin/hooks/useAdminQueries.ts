import { useQuery } from '@tanstack/react-query';
import { getCurrentStore, getStaff, listStaff } from '../services/admin.service';
import { queryKeys } from '@/lib/query-keys';

export const useListStaff = () => {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: listStaff,
  });
};

export const useGetStaff = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.staff.all, id],
    queryFn: () => getStaff(id),
    enabled: Boolean(id),
  });
};

export const useGetCurrentStore = () => {
  return useQuery({
    queryKey: queryKeys.store.current,
    queryFn: getCurrentStore,
  });
};
