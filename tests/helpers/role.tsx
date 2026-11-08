import type { ReactNode } from 'react';

import AuthContext from '@/features/auth/context/AuthContext';
import type { AuthContextInterface, Staff } from '@/features/auth/interface';
import { ROLES, type Role } from '@/lib/rbac/roles';

/** Default for tests that do not care about the role: the highest role, so every action is visible. */
export const DEFAULT_TEST_ROLE: Role = ROLES[ROLES.length - 1];

function buildStaff(role: Role | null): Staff | null {
  if (!role) return null;

  return {
    id: 'staff-1',
    name: 'Ada Okafor',
    first_name: 'Ada',
    last_name: 'Okafor',
    role,
    store_id: 'store-1',
    must_change_pin: false,
    staff_code: 'ADMIN001',
    store_name: 'Main Store',
  };
}

/** Provides a resolved auth context for the given role, without any network calls. `role={null}` simulates an unresolved session. */
export function RoleProvider({
  role = DEFAULT_TEST_ROLE,
  children,
}: {
  role?: Role | null;
  children: ReactNode;
}) {
  const value: AuthContextInterface = {
    isLoading: false,
    staff: buildStaff(role),
    role,
    logout: async () => {},
    mustChangePin: false,
    setMustChangePin: () => {},
    requirePinChange: () => {},
    completePinChange: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Wrap a rendered tree so role-gated UI sees `role`. */
export function withRole(ui: ReactNode, role: Role = DEFAULT_TEST_ROLE) {
  return <RoleProvider role={role}>{ui}</RoleProvider>;
}
