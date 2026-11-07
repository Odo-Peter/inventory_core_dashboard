import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { CreatePosAccountPayload, UpdatePosAccountPayload } from '../types';
import { createPosAccount, deactivatePosAccount, updatePosAccount } from '../service/pos.service';
import { useInvalidateAudits } from '@/features/admin/hooks/useAdminMutations';

export const useCreatePosAccount = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (payload: CreatePosAccountPayload) => createPosAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posAccounts.lists() });
      invalidateAudits();
    },
  });
};

export const useUpdatePosAccount = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePosAccountPayload }) =>
      updatePosAccount(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posAccounts.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posAccounts.detail(data.id),
      });
      invalidateAudits();
    },
  });
};

export const useDeactivatePosAccount = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (id: string) => deactivatePosAccount(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posAccounts.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posAccounts.detail(data.id),
      });
      invalidateAudits();
    },
  });
};
