/* oxlint-disable react-hooks/rules-of-hooks -- each table entry is a hook call wrapped by renderHook, not a hook call inside a component. */
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useAudits,
  useGetCurrentStore,
  useGetStaff,
  useListStaff,
} from '@/features/admin/hooks/useAdminQueries';
import {
  getAudits,
  getCurrentStore,
  getStaff,
  listStaff,
} from '@/features/admin/services/admin.service';
import { getCurrentShift, getShifts } from '@/features/shifts/services/shift.service';
import { useAllShifts, useGetCurrentShift } from '@/features/shifts/hooks/useShiftQueries';
import { listPosAccounts } from '@/features/pos/service/pos.service';
import { useListPosAccounts } from '@/features/pos/hooks/usePosQueries';
import {
  listSales,
  getPaymentOptions,
  getSalesSummary,
} from '@/features/sales/services/sales.service';
import {
  useListSales,
  usePaymentOptions,
  useSalesSummary,
} from '@/features/sales/hooks/useSalesQueries';
import {
  getStockStatus,
  listReconciliation,
  listStockMovements,
} from '@/features/inventory/stock/services/stock.service';
import {
  useItemStockStatus,
  useListReconciliation,
  useListStockMovements,
  useReconciliationDriftCount,
} from '@/features/inventory/stock/hooks/useStockMovementQueries';
import { getItemUnits, listItems } from '@/features/inventory/category/services/category.service';
import { useListItems } from '@/features/inventory/category/hooks/useCategoryQueries';
import { hasRole, type Role } from '@/lib/rbac/roles';
import { PERMISSIONS, type Permission } from '@/lib/rbac/permissions';
import { RoleProvider } from '../../../helpers/role';

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn(),
  getStaff: vi.fn(),
  getCurrentStore: vi.fn(),
  getAudits: vi.fn(),
  getAuditActions: vi.fn(),
}));

vi.mock('@/features/shifts/services/shift.service', () => ({
  getCurrentShift: vi.fn(),
  getShifts: vi.fn(),
}));

vi.mock('@/features/pos/service/pos.service', () => ({
  listPosAccounts: vi.fn(),
  getPosAccount: vi.fn(),
}));

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  createSale: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

vi.mock('@/features/inventory/stock/services/stock.service', () => ({
  listStockMovements: vi.fn(),
  getStockStatus: vi.fn(),
  listReconciliation: vi.fn(),
}));

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn(),
  getItemUnits: vi.fn(),
  listCategories: vi.fn(),
  getItemByBarcode: vi.fn(),
}));

const page = { data: [], meta: { page: 1, page_size: 25, total: 0, total_pages: 0 } };

/** Each query hook, the permission guarding it, and the service it must (not) call. */
const gatedHooks: Array<{
  name: string;
  permission: Permission;
  run: () => unknown;
  service: () => unknown;
}> = [
  {
    name: 'useListStaff',
    permission: 'staffView',
    run: () => useListStaff(),
    service: () => listStaff,
  },
  {
    name: 'useGetStaff',
    permission: 'staffView',
    run: () => useGetStaff('staff-1'),
    service: () => getStaff,
  },
  {
    name: 'useGetCurrentStore',
    permission: 'storeView',
    run: () => useGetCurrentStore(),
    service: () => getCurrentStore,
  },
  {
    name: 'useAudits',
    permission: 'auditView',
    run: () => useAudits({}),
    service: () => getAudits,
  },
  {
    name: 'useGetCurrentShift',
    permission: 'shiftCurrent',
    run: () => useGetCurrentShift('staff-1'),
    service: () => getCurrentShift,
  },
  {
    name: 'useAllShifts',
    permission: 'shiftsView',
    run: () => useAllShifts({ page: 1, page_size: 25 }),
    service: () => getShifts,
  },
  {
    name: 'useListPosAccounts',
    permission: 'posAccountsView',
    run: () => useListPosAccounts(),
    service: () => listPosAccounts,
  },
  {
    name: 'useListSales',
    permission: 'salesHistory',
    run: () => useListSales({ page: 1, page_size: 25 }),
    service: () => listSales,
  },
  {
    name: 'usePaymentOptions',
    permission: 'salesPaymentOptions',
    run: () => usePaymentOptions(),
    service: () => getPaymentOptions,
  },
  {
    name: 'useSalesSummary',
    permission: 'salesSummary',
    run: () => useSalesSummary({}),
    service: () => getSalesSummary,
  },
  {
    name: 'useListStockMovements',
    permission: 'stockView',
    run: () => useListStockMovements({ page: 1, page_size: 25 }),
    service: () => listStockMovements,
  },
  {
    name: 'useItemStockStatus',
    permission: 'stockStatus',
    run: () => useItemStockStatus('item-1'),
    service: () => getStockStatus,
  },
  {
    name: 'useListReconciliation',
    permission: 'stockReconcile',
    run: () => useListReconciliation({ page: 1, page_size: 25 }),
    service: () => listReconciliation,
  },
  {
    name: 'useReconciliationDriftCount',
    permission: 'stockReconcile',
    run: () => useReconciliationDriftCount(),
    service: () => listReconciliation,
  },
  {
    name: 'useListItems',
    permission: 'inventoryView',
    run: () => useListItems({ page: 1, page_size: 25 }),
    service: () => listItems,
  },
];

function wrapperFor(role: Role | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RoleProvider role={role}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </RoleProvider>
    );
  };
}

const ROLE_CASES: Array<Role | null> = ['cashier', 'manager', 'admin', null];

describe('role-gated query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listStaff).mockResolvedValue([]);
    vi.mocked(getStaff).mockResolvedValue({} as never);
    vi.mocked(getCurrentStore).mockResolvedValue({} as never);
    vi.mocked(getAudits).mockResolvedValue(page as never);
    vi.mocked(getCurrentShift).mockResolvedValue(null as never);
    vi.mocked(getShifts).mockResolvedValue(page as never);
    vi.mocked(listPosAccounts).mockResolvedValue(page as never);
    vi.mocked(listSales).mockResolvedValue(page as never);
    vi.mocked(getPaymentOptions).mockResolvedValue({} as never);
    vi.mocked(getSalesSummary).mockResolvedValue({} as never);
    vi.mocked(listStockMovements).mockResolvedValue(page as never);
    vi.mocked(getStockStatus).mockResolvedValue({} as never);
    vi.mocked(listReconciliation).mockResolvedValue({ ...page, data: [] } as never);
    vi.mocked(listItems).mockResolvedValue(page as never);
    vi.mocked(getItemUnits).mockResolvedValue({ units: [] });
  });

  describe.each(gatedHooks)('$name', ({ permission, run, service }) => {
    it.each(ROLE_CASES)('calls the endpoint only when the role may use %s', async (role) => {
      const minRole = permissionMinRole(permission);
      renderHook(run, { wrapper: wrapperFor(role) });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const expected = hasRole(role, minRole);
      const mock = service() as unknown as { mock: { calls: unknown[] } };
      if (expected) {
        expect(mock.mock.calls.length).toBeGreaterThan(0);
      } else {
        expect(mock.mock.calls.length).toBe(0);
      }
    });
  });

  it('never fires a gated query for an unknown role, even with the caller asking for it', async () => {
    renderHook(() => useGetStaff('staff-1', { enabled: true }), { wrapper: wrapperFor(null) });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getStaff).not.toHaveBeenCalled();
  });

  it('lets the caller enabled:false win over an allowed role', async () => {
    renderHook(() => useGetStaff('staff-1', { enabled: false }), { wrapper: wrapperFor('admin') });
    renderHook(() => useSalesSummary({}, false), { wrapper: wrapperFor('cashier') });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getStaff).not.toHaveBeenCalled();
    expect(getSalesSummary).not.toHaveBeenCalled();
  });
});

/** Minimum role per permission, read from the shared map so the test cannot drift from it. */
function permissionMinRole(permission: Permission): Role {
  return PERMISSIONS[permission].minRole;
}
