import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import {
  createStaff,
  deactivateStaff,
  forceCloseShift,
  reactivateStaff,
  resetStaffPin,
  unlockStaffAccount,
  updateStaff,
} from '../services/admin.service';
import type { AdminPinValues } from '../schemas/admin-pin.schema';
import { queryKeys } from '@/lib/query-keys';
import type { AdminEndShiftValues } from '@/features/shifts/schemas/admin-end-shift.schema';
import { invalidateShiftRelated } from '@/features/shifts/hooks/useShiftMutations';

export const useInvalidateAudits = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.audits.all });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (payload: StaffFormInput) => createStaff(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      invalidateAudits();
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffUpdateValues }) =>
      updateStaff(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useReactivateStaff = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (id: string) => reactivateStaff(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useResetStaffPin = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPinValues }) =>
      resetStaffPin(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useUnlockStaff = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPinValues }) =>
      unlockStaffAccount(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useForceCloseShift = (staffId: string) => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminEndShiftValues }) =>
      forceCloseShift(id, payload),
    onSuccess: async () => {
      await invalidateShiftRelated(queryClient, staffId);
      invalidateAudits();
    },
  });
};
