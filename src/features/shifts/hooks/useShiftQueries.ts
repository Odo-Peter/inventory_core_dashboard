import { useQuery } from '@tanstack/react-query';
import { getCurrentShift } from '../services/shift.service';

export const useGetCurrentShift = (staffId: string) => {
  return useQuery({
    queryKey: ['active-shift', staffId],
    queryFn: () => getCurrentShift(),
    enabled: Boolean(staffId),
  });
};
