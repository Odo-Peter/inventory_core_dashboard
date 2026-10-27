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
import { queryKeys } from '@/lib/query-keys';

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffFormInput) => createStaff(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffUpdateValues }) =>
      updateStaff(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
      ]);
    },
  });
};

export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
      ]);
    },
  });
};

export const useReactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateStaff(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
      ]);
    },
  });
};

export const useResetStaffPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPinValues }) =>
      resetStaffPin(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
      ]);
    },
  });
};
