import axiosInstance from '@/lib/axiosInstance';

import type { Staff, StaffResponse, StoreResponse } from '../staff/types';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import type { AdminPinValues } from '../schemas/admin-pin.schema';
import type { AdminEndShiftValues } from '@/features/shifts/schemas/admin-end-shift.schema';
import type { Shift } from '@/features/shifts/types';
import type {
  ListAuditActionsResponse,
  ListAuditsParams,
  ListAuditsResponse,
} from '@/features/audit/types';

export const createStaff = async (payload: StaffFormInput): Promise<StaffResponse> => {
  const { data } = await axiosInstance.post<StaffResponse>('/staff', payload);
  return data;
};

export const updateStaff = async (id: string, payload: StaffUpdateValues): Promise<Staff> => {
  const { data } = await axiosInstance.patch<Staff>(`/staff/${id}`, payload);
  return data;
};

export const deactivateStaff = async (id: string): Promise<Staff> => {
  const { data } = await axiosInstance.post<Staff>(`/staff/${id}/deactivate`);
  return data;
};

export const reactivateStaff = async (id: string): Promise<Staff> => {
  const { data } = await axiosInstance.post<Staff>(`/staff/${id}/reactivate`);
  return data;
};

export const resetStaffPin = async (
  id: string,
  payload: AdminPinValues,
): Promise<StaffResponse> => {
  const { data } = await axiosInstance.post<StaffResponse>(`/staff/${id}/reset-pin`, payload);
  return data;
};

export const unlockStaffAccount = async (id: string, payload: AdminPinValues): Promise<Staff> => {
  const { data } = await axiosInstance.post<Staff>(`/staff/${id}/unlock`, payload);
  return data;
};

export const listStaff = async (): Promise<Staff[]> => {
  const { data } = await axiosInstance.get<Staff[]>('/staff');
  return data;
};

export const getStaff = async (id: string): Promise<Staff> => {
  const { data } = await axiosInstance.get<Staff>(`/staff/${id}`);
  return data;
};

export const getCurrentStore = async (): Promise<StoreResponse> => {
  const { data } = await axiosInstance.get<StoreResponse>('/stores/current');
  return data;
};

export const forceCloseShift = async (id: string, payload: AdminEndShiftValues): Promise<Shift> => {
  const { data } = await axiosInstance.post<Shift>(`/shifts/${id}/force-close`, payload);
  return data;
};

export const getAuditActions = async (): Promise<ListAuditActionsResponse> => {
  const { data } = await axiosInstance.get<ListAuditActionsResponse>('/audit-logs/actions');
  return data;
};

export const getAudits = async (params: ListAuditsParams = {}): Promise<ListAuditsResponse> => {
  const { data } = await axiosInstance.get<ListAuditsResponse>(`/audit-logs`, {
    params: {
      page: params.page,
      page_size: params.page_size,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      staff_id: params.staff_id,
      from: params.from,
      to: params.to,
    },
  });
  return data;
};
