import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { getStoredToken, isTokenValid } from '@/lib/token';

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = isTokenValid(getStoredToken());

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
