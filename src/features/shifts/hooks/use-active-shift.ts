import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';
import { getActiveShift, startShift as startShiftRequest, type Shift } from '../mock/shift-api';
import type { StartShiftValues } from '../schemas/start-shift.schema';

export function useActiveShift() {
  const queryClient = useQueryClient();
  const profileQuery = useMyProfile();
  const profile = profileQuery.data ?? null;
  const staffId = profile?.id;

  const activeShiftQuery = useQuery({
    queryKey: ['active-shift', staffId],
    queryFn: () => getActiveShift(staffId as string),
    enabled: Boolean(staffId),
  });

  const startShiftMutation = useMutation({
    mutationFn: async (input: StartShiftValues) => {
      if (!profile) {
        throw new Error('You need to sign in to start a shift.');
      }

      return startShiftRequest(profile.id, profile.store_id, input);
    },
    onSuccess: (shift) => {
      queryClient.setQueryData<Shift | null>(['active-shift', staffId], shift);
    },
  });

  return {
    profile,
    activeShift: activeShiftQuery.data ?? null,
    isLoading: profileQuery.isLoading || (Boolean(staffId) && activeShiftQuery.isLoading),
    startShift: startShiftMutation.mutateAsync,
    isStarting: startShiftMutation.isPending,
  };
}
