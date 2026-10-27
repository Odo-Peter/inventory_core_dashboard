import axiosInstance from '@/lib/axiosInstance';

import type { EndShiftValues, StartShiftValues } from '../schemas/start-shift.schema';
import type { ListShiftsParams, ListShiftsResponse, ShiftStartResponse } from '../types';

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

export const getShifts = async (params: ListShiftsParams = {}): Promise<ListShiftsResponse> => {
  const { data } = await axiosInstance.get<ListShiftsResponse>(`/shifts`, {
    params: {
      staff_id: params.staff_id,
      from: params.from,
      to: params.to,
      limit: params.limit,
      cursor: params.cursor,
    },
  });
  return data;
};
