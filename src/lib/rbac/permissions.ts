import { hasRole, type Role } from './roles';

/**
 * Capability map hand-derived from `docs/api/endpoint-roles.json`.
 *
 * Keep `minRole` in sync with the `minRole` of `endpoint`. Run
 * `tests/unit/lib/rbac/permissions.test.ts` after refreshing the JSON; it fails
 * when the backend map drifts.
 *
 * `roleBehavior` entries encode rules that cannot be expressed as a minimum
 * role alone (for example "admin is denied clock-in" or "cashiers never receive
 * cost_price"). They are still checked against the documented behaviour.
 */
export interface PermissionDefinition {
  minRole: Role;
  /** Backing endpoint in `METHOD /path` form, matching endpoint-roles.json. */
  endpoint: string;
  /** Roles that are explicitly denied even when the hierarchy would allow them. */
  deniedRoles?: readonly Role[];
  /** When set, only these roles pass (used for exact-role behaviours). */
  onlyRoles?: readonly Role[];
  /** True when the capability comes from `roleBehaviors`, not the endpoint minRole. */
  roleBehavior?: boolean;
  /** Short explanation for the unusual rules. */
  note?: string;
}

const definePermissions = <T extends Record<string, PermissionDefinition>>(definitions: T): T =>
  definitions;

export const PERMISSIONS = definePermissions({
  // Shell / shared data
  dashboard: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/auth/me',
    note: 'Dashboard is available to any signed-in role.',
  },
  storeView: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/stores/current',
  },

  // Inventory / items
  inventoryView: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/items',
  },
  itemCreate: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/items',
  },
  itemEdit: {
    minRole: 'manager',
    endpoint: 'PATCH /api/v1/items/{id}',
  },
  itemChangePrice: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/items/{id}/price',
  },
  itemImage: {
    minRole: 'manager',
    endpoint: 'PUT /api/v1/items/{id}/image',
    note: 'Also covers DELETE /api/v1/items/{id}/image.',
  },
  itemViewCostPrice: {
    minRole: 'manager',
    endpoint: 'GET /api/v1/items',
    roleBehavior: true,
    note: 'Cashier item responses omit cost_price.',
  },
  itemDeactivate: {
    minRole: 'admin',
    endpoint: 'POST /api/v1/items/{id}/deactivate',
  },
  itemReactivate: {
    minRole: 'admin',
    endpoint: 'PATCH /api/v1/items/{id}',
    roleBehavior: true,
    note: 'Changing active is rejected for managers; admins may change it.',
  },
  itemPriceHistory: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/items/{id}/price-history',
  },

  // Categories
  categoriesView: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/categories',
  },
  categoryCreate: {
    minRole: 'admin',
    endpoint: 'POST /api/v1/categories',
  },
  categoryEdit: {
    minRole: 'admin',
    endpoint: 'PATCH /api/v1/categories/{id}',
  },

  // Stock movement / reconciliation
  stockView: {
    minRole: 'manager',
    endpoint: 'GET /api/v1/inventory/movements',
    note: 'Also covers GET /api/v1/inventory/items/{id}/movements.',
  },
  stockRecord: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/inventory/items/{id}/initial',
    note: 'Also covers receive, adjust, and damage.',
  },
  stockStatus: {
    minRole: 'manager',
    endpoint: 'GET /api/v1/inventory/items/{id}/stock-status',
  },
  stockReconcile: {
    minRole: 'admin',
    endpoint: 'GET /api/v1/inventory/reconciliation',
  },

  // Shifts
  shiftCurrent: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/shifts/current',
  },
  shiftClock: {
    minRole: 'cashier',
    endpoint: 'POST /api/v1/shifts/clock-in',
    deniedRoles: ['admin'],
    note: 'Admin is denied clock-in/clock-out by @DenyRoles.',
  },
  shiftsView: {
    minRole: 'manager',
    endpoint: 'GET /api/v1/shifts',
  },
  shiftsForceClose: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/shifts/{id}/force-close',
  },

  // Staff
  staffView: {
    minRole: 'manager',
    endpoint: 'GET /api/v1/staff',
    note: 'Also covers GET /api/v1/staff/{id}.',
  },
  staffCreate: {
    minRole: 'admin',
    endpoint: 'POST /api/v1/staff',
  },
  staffEdit: {
    minRole: 'admin',
    endpoint: 'PATCH /api/v1/staff/{id}',
  },
  staffDeactivate: {
    minRole: 'admin',
    endpoint: 'POST /api/v1/staff/{id}/deactivate',
  },
  staffReactivate: {
    minRole: 'admin',
    endpoint: 'POST /api/v1/staff/{id}/reactivate',
  },
  staffResetPin: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/staff/{id}/reset-pin',
  },
  staffUnlock: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/staff/{id}/unlock',
  },

  // Audit
  auditView: {
    minRole: 'admin',
    endpoint: 'GET /api/v1/audit-logs',
    note: 'Also covers GET /api/v1/audit-logs/actions.',
  },

  // POS accounts
  posAccountsView: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/pos-accounts',
  },
  posAccountsCreate: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/pos-accounts',
  },
  posAccountsEdit: {
    minRole: 'manager',
    endpoint: 'PATCH /api/v1/pos-accounts/{id}',
  },
  posAccountsDeactivate: {
    minRole: 'manager',
    endpoint: 'POST /api/v1/pos-accounts/{id}/deactivate',
  },

  // Sales
  salesCreate: {
    minRole: 'cashier',
    endpoint: 'POST /api/v1/sales',
  },
  salesHistory: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/sales',
  },
  salesDetail: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/sales/{id}',
  },
  salesReprint: {
    minRole: 'cashier',
    endpoint: 'POST /api/v1/sales/{id}/receipt-prints',
  },
  salesPaymentOptions: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/sales/payment-options',
  },
  salesSummary: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/sales/summary',
  },
  salesOwnScope: {
    minRole: 'cashier',
    endpoint: 'GET /api/v1/sales',
    onlyRoles: ['cashier'],
    note: 'Cashier sales list/summary/detail are scoped to the caller.',
  },

  // Settings
  settingsView: {
    minRole: 'admin',
    endpoint: 'PATCH /api/v1/stores/current',
    note: 'Store settings are editable by admins.',
  },
});

export type Permission = keyof typeof PERMISSIONS;

/**
 * Capability check that handles the role behaviours the inclusive hierarchy
 * cannot express. Unknown roles always fail.
 */
export function can(userRole: string | null | undefined, permission: Permission): boolean {
  const definition: PermissionDefinition | undefined = PERMISSIONS[permission];
  const role = userRole as Role | null | undefined;

  if (!definition || !hasRole(role, definition.minRole)) return false;
  if (definition.deniedRoles?.includes(role as Role)) return false;
  if (definition.onlyRoles && !definition.onlyRoles.includes(role as Role)) return false;

  return true;
}
