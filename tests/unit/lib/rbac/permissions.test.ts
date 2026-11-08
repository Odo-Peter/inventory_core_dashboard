import { describe, expect, it } from 'vitest';

import endpointRoles from '../../../../docs/api/endpoint-roles.json';
import {
  PERMISSIONS,
  can,
  type Permission,
  type PermissionDefinition,
} from '@/lib/rbac/permissions';

type DocEndpoint = { method: string; path: string; minRole: string; public: boolean };

const endpoints = endpointRoles.endpoints as DocEndpoint[];

function findEndpoint(spec: string) {
  const [method, path] = spec.split(' ');
  return endpoints.find((e) => e.method === method && e.path === path);
}

const definitions: Record<Permission, PermissionDefinition> = PERMISSIONS;
const permissionNames = Object.keys(definitions) as Permission[];

describe('PERMISSIONS drift guard against docs/api/endpoint-roles.json', () => {
  it.each(permissionNames)('%s points at a documented endpoint', (name) => {
    expect(findEndpoint(definitions[name].endpoint)).toBeDefined();
  });

  it.each(permissionNames.filter((name) => !definitions[name].roleBehavior))(
    '%s uses the same minRole as its endpoint',
    (name) => {
      const definition = definitions[name];
      const endpoint = findEndpoint(definition.endpoint);
      expect(endpoint?.minRole).toBe(definition.minRole);
    },
  );

  it.each(permissionNames.filter((name) => definitions[name].roleBehavior))(
    '%s is a documented role behaviour on its endpoint',
    (name) => {
      const definition = definitions[name];
      expect(findEndpoint(definition.endpoint)).toBeDefined();
      expect(definition.note).toBeTruthy();
    },
  );
});

describe('can', () => {
  it('grants manager-level capabilities to managers and admins only', () => {
    expect(can('cashier', 'itemCreate')).toBe(false);
    expect(can('manager', 'itemCreate')).toBe(true);
    expect(can('admin', 'itemCreate')).toBe(true);
  });

  it('denies clock-in to admins even though the hierarchy would allow it', () => {
    expect(can('cashier', 'shiftClock')).toBe(true);
    expect(can('manager', 'shiftClock')).toBe(true);
    expect(can('admin', 'shiftClock')).toBe(false);
  });

  it('scopes the sales list to cashiers only as an exact role behaviour', () => {
    expect(can('cashier', 'salesOwnScope')).toBe(true);
    expect(can('manager', 'salesOwnScope')).toBe(false);
    expect(can('admin', 'salesOwnScope')).toBe(false);
  });

  it('never grants anything to an unknown role', () => {
    for (const name of permissionNames) {
      expect(can('owner', name)).toBe(false);
      expect(can(null, name)).toBe(false);
    }
  });

  it('never grants an undefined capability', () => {
    expect(can('admin', 'notAPermission' as Permission)).toBe(false);
  });
});
