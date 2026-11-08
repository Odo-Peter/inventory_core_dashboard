import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import AuthContext from '../context/AuthContext';
import axiosInstance from '@/lib/axiosInstance';
import { clearStoredToken, getStoredToken, isTokenValid, subscribeToken } from '@/lib/token';
import { subscribeAuthEvent } from '@/lib/auth-events';
import { PageLoading } from '@/components/states';
import { normalizeRole, type Role } from '@/lib/rbac';
import { queryKeys } from '@/lib/query-keys';

import { useMyProfile } from '../hooks/useAuthQueries';
import type { AuthTokenResponse, MyProfile, Staff } from '../interface';

const MUST_CHANGE_PIN_STORAGE_KEY = 'stocktake_must_change_pin';
const STAFF_STORAGE_KEY = 'stocktake_staff';

function toStaff(profile: MyProfile, role: Role): Staff {
  return {
    id: profile.id,
    name: profile.name,
    first_name: profile.first_name,
    last_name: profile.last_name,
    role,
    store_id: profile.store_id,
    must_change_pin: profile.must_change_pin,
    staff_code: profile.staff_code,
    store_name: profile.store_name,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [mustChangePin, setMustChangePinState] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(MUST_CHANGE_PIN_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const previousRole = useRef<Role | null>(null);

  useEffect(() => subscribeToken(() => setToken(getStoredToken())), []);

  const tokenValid = isTokenValid(token);

  // The root gate makes exactly one /auth/me request per session load. While a
  // temporary PIN is in use /auth/me is expected to 403, so it stays disabled
  // and the change-PIN dialog is shown instead.
  const profileQuery = useMyProfile(tokenValid && !mustChangePin);

  const role = tokenValid ? normalizeRole(profileQuery.data?.role) : null;
  const staff = role && profileQuery.data ? toStaff(profileQuery.data, role) : null;
  const isLoading = tokenValid && !mustChangePin && profileQuery.isPending;

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
    (nextStaff?: AuthTokenResponse['staff']) => {
      if (nextStaff?.must_change_pin) {
        setMustChangePin(true);
        try {
          if (nextStaff) {
            sessionStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(nextStaff));
          }
        } catch {
          // ignore storage errors
        }
      }
    },
    [setMustChangePin],
  );

  const completePinChange = useCallback(() => {
    setMustChangePin(false);
    try {
      sessionStorage.removeItem(STAFF_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, [setMustChangePin]);

  const logout = useCallback(
    async (navigate?: (path: string) => void) => {
      // Capture the token before clearing it so the server can revoke it.
      const currentToken = getStoredToken();

      clearStoredToken();
      try {
        sessionStorage.removeItem(MUST_CHANGE_PIN_STORAGE_KEY);
        sessionStorage.removeItem(STAFF_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      setMustChangePinState(false);
      previousRole.current = null;
      queryClient.clear();

      if (navigate) navigate('/auth/login');

      if (currentToken) {
        try {
          await axiosInstance.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
        } catch {
          // Silent — the local session is already cleared and the token will
          // expire naturally if server-side revocation fails.
        }
      }
    },
    [queryClient],
  );

  // Clear a session whose token has expired, both at mount and on an interval.
  useEffect(() => {
    const checkToken = () => {
      const stored = getStoredToken();
      if (stored && !isTokenValid(stored)) void logout();
    };

    checkToken();
    const interval = setInterval(checkToken, 20000);
    return () => clearInterval(interval);
  }, [logout]);

  // A 401 anywhere signs the user out; the guards then redirect to the login
  // screen. A `pin_change_required` 403 opens the forced PIN change dialog.
  useEffect(() => {
    const unsubscribeUnauthorized = subscribeAuthEvent('unauthorized', () => {
      void logout();
    });
    const unsubscribePinChange = subscribeAuthEvent('pin-change-required', () => {
      setMustChangePin(true);
    });
    const unsubscribeForbidden = subscribeAuthEvent('forbidden', () => {
      // The role may have changed server-side. Reload the profile and let the
      // nav, routes, and hooks re-render with the new role.
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    });

    return () => {
      unsubscribeUnauthorized();
      unsubscribePinChange();
      unsubscribeForbidden();
    };
  }, [logout, queryClient, setMustChangePin]);

  // Belt-and-braces: if /auth/me succeeds but still reports must_change_pin,
  // enforce the change flow rather than trusting a stale local flag.
  useEffect(() => {
    if (profileQuery.data?.must_change_pin) setMustChangePin(true);
  }, [profileQuery.data?.must_change_pin, setMustChangePin]);

  // The interceptor also emits the event, but surface the error state in case a
  // consumer reads the query directly.
  useEffect(() => {
    const error = profileQuery.error as { status?: number; code?: string } | null;
    if (error?.status === 403 && error.code === 'pin_change_required') {
      setMustChangePin(true);
    }
  }, [profileQuery.error, setMustChangePin]);

  // Role changes do not revoke the token, so old-role data may still be cached.
  // Drop every non-profile query once the role actually changes. The profile
  // query itself is kept so the UI never loses the current role mid-refetch.
  useEffect(() => {
    if (!role) return;

    if (previousRole.current && previousRole.current !== role) {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.profile.me[0],
      });
    }

    previousRole.current = role;
  }, [role, queryClient]);

  const value = {
    isLoading,
    staff,
    role,
    logout,
    mustChangePin,
    setMustChangePin,
    requirePinChange,
    completePinChange,
  };

  if (isLoading) return <PageLoading title="Loading your session" />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
