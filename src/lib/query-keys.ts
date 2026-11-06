import type { ListAuditsParams } from '@/features/audit/types';
import type { ListCategoriesQuery } from '@/features/inventory/category/types';
import type { ListItemsQuery } from '@/features/inventory/items/types';
import type { ListMovementsQuery, ListReconciliationQuery } from '@/features/inventory/stock/types';

export const queryKeys = {
  staff: {
    all: ['staff'] as const,
    detail: (id: string) => ['staff', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (params: ListCategoriesQuery) => [...queryKeys.categories.lists(), params] as const,
  },
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (params: ListItemsQuery) => [...queryKeys.items.lists(), params] as const,
    detail: (id: string) => [...queryKeys.items.all, id] as const,
    units: ['items', 'units'] as const,
  },
  store: {
    current: ['current-store'] as const,
  },
  shifts: {
    all: ['shifts'] as const,
    active: (staffId: string) => ['active-shift', staffId] as const,
  },
  profile: {
    me: ['my-profile'] as const,
  },
  audits: {
    all: ['audits'] as const,
    lists: ['audits', 'list'] as const,
    list: (params: ListAuditsParams) => ['audits', 'list', params] as const,
  },
  auditActions: ['audit-actions'] as const,
  movementKeys: {
    all: ['stock-movements'] as const,
    list: (query: ListMovementsQuery) => [...queryKeys.movementKeys.all, 'list', query] as const,
    status: (itemId: string) => ['stock-status', itemId] as const,
  },
  reconciliationKeys: {
    all: ['stock-reconciliation'] as const,
    list: (query: ListReconciliationQuery) =>
      [...queryKeys.reconciliationKeys.all, 'list', query] as const,
  },
} as const;
