import axiosInstance from '@/lib/axiosInstance';
import type {
  PosAccount,
  PosAccountListResponse,
  ListPosAccountsQuery,
  CreatePosAccountPayload,
  UpdatePosAccountPayload,
} from '../types';

export const listPosAccounts = async (
  params: ListPosAccountsQuery = {},
): Promise<PosAccountListResponse> => {
  const { data } = await axiosInstance.get<PosAccountListResponse>('/pos-accounts', {
    params,
  });
  return data;
};

export const getPosAccount = async (id: string): Promise<PosAccount> => {
  const { data } = await axiosInstance.get<PosAccount>(`/pos-accounts/${id}`);
  return data;
};

export const createPosAccount = async (payload: CreatePosAccountPayload): Promise<PosAccount> => {
  const { data } = await axiosInstance.post<PosAccount>('/pos-accounts', payload);
  return data;
};

export const updatePosAccount = async (
  id: string,
  payload: UpdatePosAccountPayload,
): Promise<PosAccount> => {
  const { data } = await axiosInstance.patch<PosAccount>(`/pos-accounts/${id}`, payload);
  return data;
};

export const deactivatePosAccount = async (id: string): Promise<PosAccount> => {
  const { data } = await axiosInstance.post<PosAccount>(`/pos-accounts/${id}/deactivate`);
  return data;
};
