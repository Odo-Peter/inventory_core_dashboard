import { useMutation, useQueryClient } from '@tanstack/react-query';

import { endShift, startShift } from '../services/shift.service';
import type { EndShiftValues, StartShiftValues } from '../schemas/start-shift.schema';

export const useStartShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartShiftValues) => startShift(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shift-start'] });
      await queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
  });
};

export const useEndShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EndShiftValues) => endShift(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shift-start'] });
      await queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
  });
};
