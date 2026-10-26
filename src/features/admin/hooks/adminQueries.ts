import { useQuery } from '@tanstack/react-query';
import { listStaff } from '../services/admin.service';

export const useListStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => listStaff(),
  });
};
