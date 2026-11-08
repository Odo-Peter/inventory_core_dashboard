import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { getStoredToken, isTokenValid } from '@/lib/token';
import { getRoleHome, useRole, type Permission } from '@/lib/rbac';
import { useCan } from '@/lib/rbac';

import { useAuth } from '../hooks/useAuth';
import { ChangePinDialog } from '../components/change-pin-dialog';
import { AccessDenied } from './require-role';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional capability required to render the children. */
  permission?: Permission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useRole();

  const isAuthenticated = isTokenValid(getStoredToken());
  const { mustChangePin, completePinChange } = useAuth();
  const allowed = useCan(permission ?? 'dashboard');

  const handlePinChanged = () => {
    completePinChange();
    navigate(getRoleHome(role));
  };

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // A temporary PIN blocks every protected route. Only the change-PIN dialog
  // (and, from the public login screen, logging out) remains available.
  if (mustChangePin) {
    return <ChangePinDialog open={mustChangePin} onSuccess={handlePinChanged} />;
  }

  if (permission && !allowed) {
    return <AccessDenied home={getRoleHome(role)} />;
  }

  return <>{children}</>;
}
