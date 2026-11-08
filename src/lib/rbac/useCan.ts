import { can, type Permission } from './permissions';
import { useRole } from './useRole';

/** True when the current role may perform `permission`. False while unknown. */
export function useCan(permission: Permission): boolean {
  const role = useRole();
  return can(role, permission);
}

/**
 * Convenience for query hooks: combines a capability with any caller-supplied
 * `enabled` flag. Role unknown always disables the query.
 */
export function useRoleEnabled(permission: Permission, extra = true): boolean {
  const can = useCan(permission);
  return can && extra;
}
