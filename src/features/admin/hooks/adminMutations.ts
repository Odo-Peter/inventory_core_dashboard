import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import { createStaff, updateStaff } from '../services/admin.service';

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffFormInput) => createStaff(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffUpdateValues }) =>
      updateStaff(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};
