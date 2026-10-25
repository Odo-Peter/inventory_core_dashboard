import { useCallback, useEffect, useState } from 'react';

import AuthContext from '../context/AuthContext';
import axiosInstance from '@/lib/axiosInstance';
import { getStoredToken, isTokenValid, TOKEN_STORAGE_KEY } from '@/lib/token';

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
    const token = getStoredToken();

    // 2. Clear local state synchronously
    localStorage.removeItem(TOKEN_STORAGE_KEY);

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
      const token = getStoredToken();

      if (!isTokenValid(token)) {
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
