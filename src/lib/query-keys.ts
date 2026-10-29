import type { ListAuditsParams } from '@/features/audit/types';
import type { ListCategoriesQuery } from '@/features/category/types';

export const queryKeys = {
  staff: {
    all: ['staff'] as const,
    detail: (id: string) => ['staff', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: ['categories', 'list'] as const,
    list: (params: ListCategoriesQuery) => ['categories', 'list', params] as const,
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
} as const;
