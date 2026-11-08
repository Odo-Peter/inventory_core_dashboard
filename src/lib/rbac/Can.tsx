import type { ReactNode } from 'react';

import type { Permission } from './permissions';
import { useCan } from './useCan';

interface CanProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders `children` only when the current role may perform `permission`. */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);

  return <>{allowed ? children : fallback}</>;
}
