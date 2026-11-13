import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsStore } from '@/features/settings/hooks/useSettingsQueries';
import { useUpdateStoreSettings } from '@/features/settings/hooks/useSettingsMutations';
import { getCurrentStore, updateCurrentStore } from '@/features/admin/services/admin.service';
import type { MyProfile } from '@/features/auth/interface';
import { queryKeys } from '@/lib/query-keys';
import { RoleProvider } from '../../../../helpers/role';
import { makeStore, storeFixture } from '../../../../helpers/store';
import type { Role } from '@/lib/rbac/roles';

vi.mock('@/features/admin/services/admin.service', () => ({
  getCurrentStore: vi.fn(),
  updateCurrentStore: vi.fn(),
}));

const profile: MyProfile = {
  id: 'staff-1',
  name: 'Ada Okafor',
  first_name: 'Ada',
  last_name: 'Okafor',
  role: 'admin',
  store_id: 'store-1',
  must_change_pin: false,
  active_shift_id: null,
  staff_code: 'ADMIN001',
  store_name: 'Main Store',
};

function createWrapper(role: Role | null = 'admin') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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

describe('settings hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentStore).mockResolvedValue(storeFixture);
    vi.mocked(updateCurrentStore).mockResolvedValue(storeFixture);
  });

  it.each(['cashier', 'manager', 'admin'] as const)(
    'loads the current store for a %s',
    async (role) => {
      const { wrapper } = createWrapper(role);

      const { result } = renderHook(() => useSettingsStore(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(storeFixture);
      expect(getCurrentStore).toHaveBeenCalledTimes(1);
    },
  );

  it('makes no store request while the role is unknown', async () => {
    const { wrapper } = createWrapper(null);

    renderHook(() => useSettingsStore(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getCurrentStore).not.toHaveBeenCalled();
  });

  it('sends only the changed fields and updates the store cache', async () => {
    const updated = makeStore({ name: 'Fresh Mart' });
    vi.mocked(updateCurrentStore).mockResolvedValue(updated);
    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateStoreSettings(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Fresh Mart' });
    });

    expect(updateCurrentStore).toHaveBeenCalledWith({ name: 'Fresh Mart' });
    expect(queryClient.getQueryData(queryKeys.store.current)).toEqual(updated);
  });

  it('keeps the cached profile store name in sync for name consumers', async () => {
    const updated = makeStore({ name: 'Fresh Mart' });
    vi.mocked(updateCurrentStore).mockResolvedValue(updated);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.profile.me, profile);

    const { result } = renderHook(() => useUpdateStoreSettings(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Fresh Mart' });
    });

    expect(queryClient.getQueryData<MyProfile>(queryKeys.profile.me)?.store_name).toBe(
      'Fresh Mart',
    );
  });
});
