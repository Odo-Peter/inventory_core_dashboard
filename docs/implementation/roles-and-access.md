# Roles and access

The frontend shows and hides screens, routes, navigation, actions, and queries by role. This is a convenience only: the API enforces every rule, and the UI must keep handling server errors (`403`, `401`) for anything it hides.

## Source of truth

- `docs/api/endpoint-roles.json` and `docs/api/endpoint-roles.md` define the roles (`cashier`, `manager`, `admin`), the inclusive hierarchy, each endpoint's `minRole`, role behaviours, and `/auth/me` session rules.
- `src/lib/rbac/permissions.ts` maps each UI capability to the endpoint that backs it. Each entry's `minRole` and `endpoint` must match the JSON. `tests/unit/lib/rbac/permissions.test.ts` fails when they drift.

## Where things live

| File                                          | Purpose                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| `src/lib/rbac/roles.ts`                       | Role list, `hasRole` (inclusive), `getRoleHome`                |
| `src/lib/rbac/permissions.ts`                 | `PERMISSIONS` capability map and `can(role, permission)`       |
| `src/lib/rbac/useCan.ts`                      | `useCan`, `useRoleEnabled` for query hooks                     |
| `src/lib/rbac/Can.tsx`                        | `<Can permission fallback>` for conditional UI                 |
| `src/features/auth/provider/AuthProvider.tsx` | Resolves `/auth/me` once and exposes `role` and `staff`        |
| `src/features/auth/guards/`                   | `ProtectedRoute`, `GuestRoute`, `RequireRole`                  |
| `src/app/router.tsx`                          | Wraps each product route with `RequireRole` and its permission |
| `src/components/layout/nav-items.ts`          | Single navigation config, filtered by `getVisibleNavGroups`    |
| `src/lib/axiosInstance.ts`                    | Central `401` sign-out and `403` toast plus `/auth/me` refetch |

## Rules

- Role checks go through `can`, `useCan`, or `<Can>`. Do not compare role strings in components.
- Unknown or missing roles never grant access. While the role is loading, nothing role-gated renders and no gated query runs.
- Query hooks gate themselves with `useRoleEnabled(permission, existingEnabled)`. Keep any caller `enabled` flag so it still wins.
- Mutations are not role-gated in hooks. Hide the button instead, and let the server error show if it is still reached.
- `/auth/me` and public or auth-only endpoints are never gated.
- Query keys come only from `src/lib/query-keys.ts`. The cache is cleared on logout and whenever the role changes.

## Adding a capability

1. Confirm the endpoint and its `minRole` in `docs/api/endpoint-roles.json`.
2. Add an entry to `PERMISSIONS` with `minRole`, the backing `endpoint` in `METHOD /path` form, and a note if it is a role behaviour (`roleBehavior`, `deniedRoles`, or `onlyRoles`).
3. Use it: `useCan('name')` for hooks, `<Can permission="name">` for UI, and `useRoleEnabled('name', enabled)` in query hooks.
4. Run `npx vitest run tests/unit/lib/rbac`. The drift guard checks the new entry against the JSON.

## Refreshing after a backend change

1. Regenerate `docs/api/endpoint-roles.json` and `.md` from the backend.
2. Diff `minRole` values and role behaviours against `PERMISSIONS`. Update any that changed.
3. Run the RBAC unit tests. A failure means `PERMISSIONS` no longer matches the API documentation.
4. If an endpoint the frontend calls is missing from the JSON, stop and resolve it before shipping. Do not guess a role.

## Known open questions (from the role docs)

- Admins can call `POST /sales` but cannot clock in, so an admin without an open shift sees the no-shift state on New Sale.
- Role changes do not revoke existing tokens. The UI reloads `/auth/me` on focus and on any `403`, so a demoted user loses access on the next check.
- `staff_code` is returned at runtime but omitted from the DTO and OpenAPI.
