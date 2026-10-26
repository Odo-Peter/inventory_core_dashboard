import axiosInstance from '@/lib/axiosInstance';

import type { StaffFormInput, StaffUpdateValues } from '../schemas/staff-form.schema';
import type { Staff, StaffResponse } from '../staff/types';

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

export const listStaff = async (): Promise<Staff[]> => {
  const { data } = await axiosInstance.get<Staff[]>('/staff');
  return data;
};
