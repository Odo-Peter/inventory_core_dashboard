import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { getStoredToken, isTokenValid } from '@/lib/token';
import { getRoleHome } from '@/lib/rbac';
import { useAuth } from '../hooks/useAuth';

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { role } = useAuth();
  const isAuthenticated = isTokenValid(getStoredToken());

  // Wait for the root gate to resolve the role before redirecting. While the
  // profile is still unknown (or failed), keep the public screen visible.
  if (isAuthenticated && role) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <>{children}</>;
}
