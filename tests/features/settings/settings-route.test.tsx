import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from '@/features/auth/guards/protected-route';
import { SettingsPage } from '@/features/settings/pages/settings-page';
import { getCurrentStore } from '@/features/admin/services/admin.service';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import type { Role } from '@/lib/rbac/roles';
import { createToken } from '../../helpers/token';
import { RoleProvider } from '../../helpers/role';
import { storeFixture } from '../../helpers/store';

vi.mock('@/features/admin/services/admin.service', () => ({
  getCurrentStore: vi.fn(),
  updateCurrentStore: vi.fn(),
}));

function renderRoute(role: Role | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <RoleProvider role={role}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route
              path="/settings"
              element={
                <ProtectedRoute permission="settingsView">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );
}

describe('settings route guard', () => {
  beforeEach(() => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createToken(3600));
    vi.clearAllMocks();
    vi.mocked(getCurrentStore).mockResolvedValue(storeFixture);
  });

  afterEach(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it.each(['cashier', 'manager', 'admin'] as const)(
    'renders the settings page for a %s',
    async (role) => {
      renderRoute(role);

      expect(
        await screen.findByRole('heading', { name: 'Settings', level: 1 }),
      ).toBeInTheDocument();
      expect(getCurrentStore).toHaveBeenCalled();
    },
  );

  it('shows the no-access page for an unknown role and makes no store request', () => {
    renderRoute(null);

    expect(screen.getByText("You don't have access")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Settings', level: 1 })).not.toBeInTheDocument();
    expect(getCurrentStore).not.toHaveBeenCalled();
  });
});
