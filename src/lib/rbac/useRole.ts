import { useContext } from 'react';

import AuthContext from '@/features/auth/context/AuthContext';
import type { Role } from './roles';

/**
 * Current role from the shared auth context, or `null` while it is unknown.
 * Reads the context directly so components rendered outside the provider (for
 * example isolated stories or tests) never throw.
 */
export function useRole(): Role | null {
  return useContext(AuthContext)?.role ?? null;
}
