import axios from 'axios';
import { toast } from 'sonner';

import { getApiBaseUrl } from '@/config/config';
import { getStoredToken } from '@/lib/token';
import { emitAuthEvent } from './auth-events';
import { toApiError, type ApiError } from './api-error';

const PUBLIC_API_ROUTES = ['/auth/login'];

// A wrong current PIN should show a form error, not sign the user out.
const SESSION_EXEMPT_ROUTES = ['/auth/login', '/auth/change-pin'];

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

const isSessionExempt = (url: string | undefined) => {
  const cleanUrl = normalizeUrl(url);
  return SESSION_EXEMPT_ROUTES.some((route) => cleanUrl.startsWith(route));
};

const isAuthMe = (url: string | undefined) => normalizeUrl(url) === '/auth/me';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    // A caller may pass an explicit token (for example logout after the local
    // token has already been cleared).
    const hasExplicitToken = Boolean(config.headers?.Authorization);

    if (!token && !hasExplicitToken && isProtectedRoute(config.url)) {
      return Promise.reject(new axios.Cancel('User not authenticated'));
    }

    if (token && !hasExplicitToken) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error) as ApiError;
    const url = error?.config?.url as string | undefined;

    if (apiError.status === 401 && !isSessionExempt(url)) {
      emitAuthEvent('unauthorized');
    }

    if (apiError.status === 403) {
      if (apiError.code === 'pin_change_required') {
        // Expected while a temporary PIN is in use; the auth provider shows the
        // change-PIN flow and must not refetch /auth/me in a loop.
        emitAuthEvent('pin-change-required');
      } else if (!isAuthMe(url)) {
        toast.error("You don't have permission to do that");
        // The role may have changed server-side (role changes do not bump
        // token_version), so reload the profile and let the guards re-render.
        emitAuthEvent('forbidden');
      }
    }

    return Promise.reject(apiError);
  },
);

export default axiosInstance;
