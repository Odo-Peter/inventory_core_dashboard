import { getApiBaseUrl } from '@/config/config';
import { getStoredToken } from '@/lib/token';
import axios from 'axios';

const PUBLIC_API_ROUTES = ['/'];

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
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error(
          'An error occurred while processing your request. Please try again or refresh the page.',
        ),
      );
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(
        new Error('You appear to be offline. Please check your internet connection and try again.'),
      );
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
