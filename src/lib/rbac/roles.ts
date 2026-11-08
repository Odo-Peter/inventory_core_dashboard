/**
 * Role model mirrored from `docs/api/endpoint-roles.json`.
 *
 * The backend hierarchy is inclusive: cashier < manager < admin. A route that
 * requires `manager` also allows `admin`. `hasRole` implements that rule and
 * returns `false` for unknown/absent roles so callers never grant access by
 * accident.
 */
export const ROLES = ['cashier', 'manager', 'admin'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = {
  cashier: 0,
  manager: 1,
  admin: 2,
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Coerce a server value into a known role, or `null` when it is unknown/missing. */
export function normalizeRole(value: unknown): Role | null {
  return isRole(value) ? value : null;
}

/** True when `userRole` is at least `minRole` in the inclusive hierarchy. */
export function hasRole(userRole: string | null | undefined, minRole: Role): boolean {
  const role = normalizeRole(userRole);

  if (!role) return false;

  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/** True only for the exact role, used for role behaviours such as "own sales only". */
export function isExactRole(userRole: string | null | undefined, role: Role): boolean {
  return normalizeRole(userRole) === role;
}

/**
 * Landing route for each role. Cashiers land on the till; managers and admins
 * land on the dashboard. Unknown roles stay on the public login route.
 */
export const ROLE_HOME: Record<Role, string> = {
  cashier: '/sales/new',
  manager: '/dashboard',
  admin: '/dashboard',
};

export function getRoleHome(userRole: string | null | undefined): string {
  const role = normalizeRole(userRole);
  return role ? ROLE_HOME[role] : '/';
}
