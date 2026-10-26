import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import {
  createStaff,
  deactivateStaff,
  reactivateStaff,
  resetStaffPin,
  updateStaff,
} from '../services/admin.service';
import type { AdminPinValues } from '../schemas/admin-pin.schema';

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
    onSuccess: async (_data, variable) => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      await queryClient.invalidateQueries({ queryKey: ['staff', variable.id] });
    },
  });
};

export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useReactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateStaff(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useResetStaffPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPinValues }) =>
      resetStaffPin(id, payload),
    onSuccess: async (_data, variable) => {
      await queryClient.invalidateQueries({ queryKey: ['staff', variable.id] });
    },
  });
};
