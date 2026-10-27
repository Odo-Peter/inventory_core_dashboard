import { useQuery } from '@tanstack/react-query';
import { getCurrentStore, listStaff } from '../services/admin.service';
import { queryKeys } from '@/lib/query-keys';

export const useListStaff = () => {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: listStaff,
  });
};

export const useGetCurrentStore = () => {
  return useQuery({
    queryKey: queryKeys.store.current,
    queryFn: getCurrentStore,
  });
};
