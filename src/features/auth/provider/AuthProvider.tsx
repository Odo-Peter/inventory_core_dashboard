import { useCallback, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

import AuthContext from '../context/AuthContext';
import axiosInstance from '@/lib/axiosInstance';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded: { exp?: number } = jwtDecode(token);
    if (!decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(false);
    };

    initApp();
  }, []);

  const logout = useCallback(async (navigate?: (path: string) => void) => {
    // 1. Capture token BEFORE clearing localStorage
    const token = localStorage.getItem('stocktake_access_token');

    // 2. Clear local state synchronously
    localStorage.removeItem('stocktake_access_token');

    // 3. Navigate immediately
    if (navigate) {
      navigate('/auth/login');
    }

    // 4. Fire API with explicitly set token — not dependent on interceptor
    if (token) {
      try {
        await axiosInstance.post('/auth/logout', null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Silent — local session is already cleared,
        // token will expire naturally if blacklisting fails
      }
    }
  }, []);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('stocktake_access_token');

      if (!token || isTokenExpired(token)) {
        logout();
      }
    };
    checkToken();

    const interval = setInterval(checkToken, 20000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    isLoading,
    logout,
  };

  if (isLoading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
