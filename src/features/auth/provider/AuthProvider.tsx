import { useCallback, useEffect, useState } from 'react';

import AuthContext from '../context/AuthContext';
import axiosInstance from '@/lib/axiosInstance';
import { getStoredToken, isTokenValid, TOKEN_STORAGE_KEY } from '@/lib/token';
import type { AuthTokenResponse } from '../interface';

const MUST_CHANGE_PIN_STORAGE_KEY = 'stocktake_must_change_pin';
const STAFF_STORAGE_KEY = 'stocktake_staff';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePin, setMustChangePinState] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(MUST_CHANGE_PIN_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(false);
    };

    initApp();
  }, []);

  const setMustChangePin = useCallback((value: boolean) => {
    setMustChangePinState(value);
    try {
      if (value) {
        sessionStorage.setItem(MUST_CHANGE_PIN_STORAGE_KEY, 'true');
      } else {
        sessionStorage.removeItem(MUST_CHANGE_PIN_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const requirePinChange = useCallback(
    (staff?: AuthTokenResponse['staff']) => {
      if (staff?.must_change_pin) {
        setMustChangePin(true);
        try {
          if (staff) {
            sessionStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
          }
        } catch {
          // ignore
        }
      }
    },
    [setMustChangePin],
  );

  const completePinChange = useCallback(() => {
    setMustChangePin(false);
  }, [setMustChangePin]);

  const logout = useCallback(async (navigate?: (path: string) => void) => {
    // 1. Capture token BEFORE clearing sessionStorage
    const token = getStoredToken();

    // 2. Clear local state synchronously
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(MUST_CHANGE_PIN_STORAGE_KEY);
    sessionStorage.removeItem(STAFF_STORAGE_KEY);

    setMustChangePinState(false);

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
    mustChangePin,
    setMustChangePin,
    requirePinChange,
    completePinChange,
  };

  if (isLoading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
