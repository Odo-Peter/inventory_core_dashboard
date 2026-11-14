import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSalesOverview } from '@/features/dashboard/hooks/useDashboardQueries';
import { getSalesOverview } from '@/features/sales/services/sales.service';
import { queryKeys } from '@/lib/query-keys';
import { hasRole, type Role } from '@/lib/rbac/roles';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { makeSalesOverview } from '../../../../helpers/dashboard';
import { RoleProvider } from '../../../../helpers/role';

vi.mock('@/features/sales/services/sales.service', () => ({
  getSalesOverview: vi.fn(),
}));

function createWrapper(role: Role | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RoleProvider role={role}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </RoleProvider>
    );
  }

  return { queryClient, wrapper: Wrapper };
}

describe('useSalesOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSalesOverview).mockResolvedValue(makeSalesOverview());
  });

  it('loads the overview under the dashboard key', async () => {
    const { queryClient, wrapper } = createWrapper('manager');

    const { result } = renderHook(() => useSalesOverview(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(makeSalesOverview());
    expect(getSalesOverview).toHaveBeenCalledTimes(1);

    const query = queryClient.getQueryCache().find({ queryKey: queryKeys.dashboard.overview });
    const observer = query?.observers[0];
    expect(observer?.options.staleTime).toBe(30_000);
    expect(observer?.options.refetchOnWindowFocus).toBe(true);
  });

  it.each(['cashier', 'manager', 'admin'] as const)(
    'requests the overview for %s',
    async (role) => {
      const minRole = PERMISSIONS.salesOverview.minRole;
      const { wrapper } = createWrapper(role);

      const { result } = renderHook(() => useSalesOverview(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(getSalesOverview).toHaveBeenCalledTimes(hasRole(role, minRole) ? 1 : 0);
    },
  );

  it('does not request the overview for an unknown role', () => {
    const { wrapper } = createWrapper(null);

    const { result } = renderHook(() => useSalesOverview(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSalesOverview).not.toHaveBeenCalled();
  });
});
