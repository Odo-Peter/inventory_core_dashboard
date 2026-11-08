import { describe, expect, it } from 'vitest';

import { ROLES, getRoleHome, hasRole, normalizeRole, type Role } from '@/lib/rbac/roles';

const rank: Record<Role, number> = { cashier: 0, manager: 1, admin: 2 };

describe('hasRole', () => {
  it.each(ROLES.flatMap((userRole) => ROLES.map((minRole) => [userRole, minRole] as const)))(
    '%s against minimum %s follows the inclusive hierarchy',
    (userRole, minRole) => {
      expect(hasRole(userRole, minRole)).toBe(rank[userRole] >= rank[minRole]);
    },
  );

  it.each([[null], [undefined], [''], ['owner'], ['ADMIN']])(
    'rejects unknown or missing role %p',
    (value) => {
      expect(hasRole(value, 'cashier')).toBe(false);
    },
  );
});

describe('normalizeRole', () => {
  it('returns known roles and null for anything else', () => {
    expect(normalizeRole('manager')).toBe('manager');
    expect(normalizeRole('superuser')).toBeNull();
    expect(normalizeRole(42)).toBeNull();
  });
});

describe('getRoleHome', () => {
  it('sends cashiers to the till and managers/admins to the dashboard', () => {
    expect(getRoleHome('cashier')).toBe('/sales/new');
    expect(getRoleHome('manager')).toBe('/dashboard');
    expect(getRoleHome('admin')).toBe('/dashboard');
  });

  it('keeps unknown roles on the public login route', () => {
    expect(getRoleHome(undefined)).toBe('/');
    expect(getRoleHome('owner')).toBe('/');
  });
});
