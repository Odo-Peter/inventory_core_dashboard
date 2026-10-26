import type { ReactNode } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router';

import { getStoredToken, isTokenValid } from '@/lib/token';
import { useAuth } from '../hooks/useAuth';
import { ChangePinDialog } from '../components/change-pin-dialog';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = isTokenValid(getStoredToken());
  const { mustChangePin, completePinChange } = useAuth();

  const handlePinChanged = () => {
    completePinChange();
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (mustChangePin) {
    return (
      <>
        <ChangePinDialog open={mustChangePin} onSuccess={handlePinChanged} />
        {children}
      </>
    );
  }

  return <>{children}</>;
}
