import { useMutation, useQueryClient } from '@tanstack/react-query';

import { endShift, startShift } from '../services/shift.service';
import { queryKeys } from '@/lib/query-keys';
import type { EndShiftValues, StartShiftValues } from '../schemas/start-shift.schema';

async function invalidateShiftRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  staffId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
    staffId
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.shifts.active(staffId),
        })
      : queryClient.invalidateQueries({ queryKey: ['active-shift'] }),
  ]);
}

export const useStartShift = (staffId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartShiftValues) => startShift(payload),
    onSuccess: async () => {
      await invalidateShiftRelated(queryClient, staffId);
    },
  });
};

export const useEndShift = (staffId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EndShiftValues) => endShift(payload),
    onSuccess: async () => {
      await invalidateShiftRelated(queryClient, staffId);
    },
  });
};
