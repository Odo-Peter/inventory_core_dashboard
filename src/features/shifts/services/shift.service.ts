import axiosInstance from '@/lib/axiosInstance';

import type { EndShiftValues, StartShiftValues } from '../schemas/start-shift.schema';
import type { ListShiftsParams, ListShiftsResponse, Shift } from '../types';

export const startShift = async (payload: StartShiftValues): Promise<Shift> => {
  const { data } = await axiosInstance.post<Shift>(`/shifts/clock-in`, payload);
  return data;
};

export const endShift = async (payload: EndShiftValues): Promise<Shift> => {
  const { data } = await axiosInstance.post<Shift>(`/shifts/clock-out`, payload);
  return data;
};

export const getCurrentShift = async (): Promise<Shift> => {
  const { data } = await axiosInstance.get<Shift>(`/shifts/current`);
  return data;
};

export const getShifts = async (params: ListShiftsParams = {}): Promise<ListShiftsResponse> => {
  const { data } = await axiosInstance.get<ListShiftsResponse>(`/shifts`, {
    params: {
      staff_id: params.staff_id,
      from: params.from,
      to: params.to,
      page: params.page,
      page_size: params.page_size,
    },
  });
  return data;
};
