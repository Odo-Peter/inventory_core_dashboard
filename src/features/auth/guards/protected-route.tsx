import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { getStoredToken, isTokenValid } from '@/lib/token';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = isTokenValid(getStoredToken());

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
