import axiosInstance from '@/lib/axiosInstance';
import type { AuthTokenResponse, LoginFormInterface, MyProfile } from '../interface';

export const login = async (payload: LoginFormInterface): Promise<AuthTokenResponse> => {
  const { data } = await axiosInstance.post<AuthTokenResponse>('/auth/login', payload);
  return data;
};

export const myProfile = async (): Promise<MyProfile> => {
  const { data } = await axiosInstance.get<MyProfile>('/auth/me');
  return data;
};
