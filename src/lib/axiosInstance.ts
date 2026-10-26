import axios from 'axios';

import { getApiBaseUrl } from '@/config/config';
import { getStoredToken } from '@/lib/token';
import { toApiError } from './api-error';

const PUBLIC_API_ROUTES = ['/auth/login'];

const normalizeUrl = (url: string | undefined) => {
  if (!url) return '';
  try {
    return new URL(url, 'http://placeholder').pathname;
  } catch {
    return url;
  }
};

const isProtectedRoute = (url: string | undefined) => {
  const cleanUrl = normalizeUrl(url);
  return !PUBLIC_API_ROUTES.some((route) => cleanUrl.startsWith(route));
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (!token && isProtectedRoute(config.url)) {
      return Promise.reject(new axios.Cancel('User not authenticated'));
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

export default axiosInstance;
