import axiosInstance from '@/lib/axiosInstance';
import type { AuthTokenResponse, LoginFormInterface } from '../interface';

export const login = async (payload: LoginFormInterface): Promise<AuthTokenResponse> => {
  const { data } = await axiosInstance.post<AuthTokenResponse>('/auth/login', payload);
  return data;
};
