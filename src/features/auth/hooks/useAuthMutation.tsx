import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePin, login } from '../services/auth.service';
import { queryKeys } from '@/lib/query-keys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
};

export const useChangePin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
};
