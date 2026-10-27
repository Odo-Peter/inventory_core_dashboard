import { useQuery } from '@tanstack/react-query';
import { getCurrentStore, listStaff } from '../services/admin.service';

export const useListStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => listStaff(),
  });
};

export const useGetCurrentStore = () => {
  return useQuery({
    queryKey: ['current-store'],
    queryFn: () => getCurrentStore(),
  });
};
