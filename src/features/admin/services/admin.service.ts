import axiosInstance from '@/lib/axiosInstance';

import type { Staff, StaffResponse, StoreResponse } from '../staff/types';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import type { AdminPinValues } from '../schemas/admin-pin.schema';

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

export const listStaff = async (): Promise<Staff[]> => {
  const { data } = await axiosInstance.get<Staff[]>('/staff');
  return data;
};

export const getCurrentStore = async (): Promise<StoreResponse> => {
  const { data } = await axiosInstance.get<StoreResponse>('/stores/current');
  return data;
};
