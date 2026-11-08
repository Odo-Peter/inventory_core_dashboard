import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCurrentShift, getShifts } from '../services/shift.service';
import { queryKeys } from '@/lib/query-keys';
import { useRoleEnabled } from '@/lib/rbac';
import type { ListShiftsParams } from '../types';

export const useGetCurrentShift = (staffId: string) => {
  return useQuery({
    queryKey: queryKeys.shifts.active(staffId),
    queryFn: getCurrentShift,
    enabled: useRoleEnabled('shiftCurrent', Boolean(staffId)),
  });
};

export const useAllShifts = (params: ListShiftsParams = {}) => {
  return useQuery({
    queryKey: [...queryKeys.shifts.all, params] as const,
    queryFn: () => getShifts(params),
    placeholderData: keepPreviousData,
    enabled: useRoleEnabled('shiftsView'),
  });
};
