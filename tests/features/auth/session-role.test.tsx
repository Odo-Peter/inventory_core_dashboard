import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '@/lib/axiosInstance';
import { AuthProvider } from '@/features/auth/provider/AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MyProfile } from '@/features/auth/interface';
import { myProfile } from '@/features/auth/services/auth.service';
import { listStaff } from '@/features/admin/services/admin.service';
import { queryKeys } from '@/lib/query-keys';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import { createToken } from '../../helpers/token';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
  changePin: vi.fn(),
  myProfile: vi.fn(),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn(),
}));

const profile: MyProfile = {
  id: 'staff-1',
  name: 'Chidi Nwosu',
  first_name: 'Chidi',
  last_name: 'Nwosu',
  role: 'manager',
  store_id: 'store-1',
  must_change_pin: false,
  active_shift_id: null,
  staff_code: 'MGR001',
  store_name: 'Main Store',
};

/** Make the next request on the shared client fail with the given HTTP status. */
function failNextRequestWith(status: number, data: Record<string, unknown> = {}) {
  return (config: InternalAxiosRequestConfig) => {
    const response = {
      status,
      statusText: '',
      headers: {},
      config,
      data,
    };
    return Promise.reject(
      new AxiosError('request failed', 'ERR_BAD_REQUEST', config, null, response as never),
    );
  };
}

function renderSession(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>,
  );

  return { queryClient, ...view };
}

function RoleReader() {
  const { role, isLoading } = useAuth();
  return <div>{isLoading ? 'resolving' : `role:${role ?? 'none'}`}</div>;
}

describe('root session gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows the loading state and fires no gated request until the role is known', async () => {
    vi.mocked(myProfile).mockReturnValue(new Promise(() => {}));
    vi.mocked(listStaff).mockResolvedValue([]);

    renderSession(<RoleReader />);

    expect(screen.getByText('Loading your session')).toBeInTheDocument();
    expect(screen.queryByText(/role:/)).not.toBeInTheDocument();
    expect(listStaff).not.toHaveBeenCalled();
  });

  it('resolves /auth/me once and exposes the role to the tree', async () => {
    vi.mocked(myProfile).mockResolvedValue(profile);

    renderSession(<RoleReader />);

    expect(await screen.findByText('role:manager')).toBeInTheDocument();
    expect(myProfile).toHaveBeenCalledTimes(1);
  });

  it('does not expose a role when /auth/me fails', async () => {
    vi.mocked(myProfile).mockRejectedValue(new Error('server down'));

    renderSession(<RoleReader />);

    expect(await screen.findByText('role:none')).toBeInTheDocument();
  });
});

describe('central 401 and 403 handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
    vi.mocked(myProfile).mockResolvedValue(profile);
    vi.spyOn(axiosInstance, 'post').mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('shows the permission toast and refetches /auth/me on a 403', async () => {
    renderSession(<RoleReader />);
    expect(await screen.findByText('role:manager')).toBeInTheDocument();
    expect(myProfile).toHaveBeenCalledTimes(1);

    await act(async () => {
      await axiosInstance
        .get('/staff', { adapter: failNextRequestWith(403, { code: 'forbidden' }) })
        .catch(() => undefined);
    });

    expect(toast.error).toHaveBeenCalledWith("You don't have permission to do that");
    await waitFor(() => expect(myProfile).toHaveBeenCalledTimes(2));
  });

  it('does not toast or refetch when /auth/me itself is forbidden', async () => {
    renderSession(<RoleReader />);
    expect(await screen.findByText('role:manager')).toBeInTheDocument();

    await act(async () => {
      await axiosInstance
        .get('/auth/me', { adapter: failNextRequestWith(403, { code: 'pin_change_required' }) })
        .catch(() => undefined);
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(myProfile).toHaveBeenCalledTimes(1);
  });

  it('signs the user out on a 401 and clears the stored token', async () => {
    renderSession(<RoleReader />);
    expect(await screen.findByText('role:manager')).toBeInTheDocument();

    await act(async () => {
      await axiosInstance
        .get('/staff', { adapter: failNextRequestWith(401, { code: 'unauthorized' }) })
        .catch(() => undefined);
    });

    await waitFor(() => expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull());
  });
});

describe('logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
    vi.mocked(myProfile).mockResolvedValue(profile);
    vi.spyOn(axiosInstance, 'post').mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('clears every cached query so the next user never sees previous role data', async () => {
    const { queryClient } = renderSession(<LogoutButton />);
    await screen.findByRole('button', { name: 'Sign out' });

    queryClient.setQueryData(queryKeys.staff.all, [{ id: 'staff-9' }]);
    queryClient.setQueryData(queryKeys.items.all, [{ id: 'item-9' }]);

    screen.getByRole('button', { name: 'Sign out' }).click();

    await waitFor(() => expect(queryClient.getQueryData(queryKeys.staff.all)).toBeUndefined());
    expect(queryClient.getQueryData(queryKeys.items.all)).toBeUndefined();
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button type="button" onClick={() => void logout()}>
      Sign out
    </button>
  );
}
