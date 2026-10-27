import axiosInstance from '@/lib/axiosInstance';

import type { EndShiftValues, StartShiftValues } from '../schemas/start-shift.schema';
import type { ShiftStartResponse } from '../types';

export const startShift = async (payload: StartShiftValues): Promise<ShiftStartResponse> => {
  const { data } = await axiosInstance.post<ShiftStartResponse>(`/shifts/clock-in`, payload);
  return data;
};

export const endShift = async (payload: EndShiftValues): Promise<ShiftStartResponse> => {
  const { data } = await axiosInstance.post<ShiftStartResponse>(`/shifts/clock-out`, payload);
  return data;
};

export const getCurrentShift = async (): Promise<ShiftStartResponse> => {
  const { data } = await axiosInstance.get<ShiftStartResponse>(`/shifts/current`);
  return data;
};
