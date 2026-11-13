import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsPage } from '@/features/settings/pages/settings-page';
import { ShortcutsCard } from '@/features/settings/components/shortcuts-card';
import { getCurrentStore, updateCurrentStore } from '@/features/admin/services/admin.service';
import { dateTimeFormatter } from '@/features/admin/staff/utils';
import { queryKeys } from '@/lib/query-keys';
import type { Role } from '@/lib/rbac/roles';
import type { StoreResponse } from '@/features/admin/staff/types';
import { RoleProvider } from '../../helpers/role';
import { makeStore, storeFixture } from '../../helpers/store';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  getCurrentStore: vi.fn(),
  updateCurrentStore: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
  changePin: vi.fn(),
  myProfile: vi.fn(),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderPage(role: Role = 'admin', queryClient = createQueryClient()) {
  render(
    <RoleProvider role={role}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </RoleProvider>,
  );

  return queryClient;
}

async function findCard(name: string) {
  return screen.findByRole('region', { name });
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentStore).mockResolvedValue(storeFixture);
    vi.mocked(updateCurrentStore).mockResolvedValue(storeFixture);
  });

  it('shows the signed-in account from /auth/me', async () => {
    renderPage('admin');

    const account = await findCard('My account');

    expect(within(account).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(account).getByText('ADMIN001')).toBeInTheDocument();
    expect(within(account).getByText('Admin')).toBeInTheDocument();
    expect(within(account).getByText('Main Store')).toBeInTheDocument();
  });

  it('disables save and explains there are no changes', async () => {
    const user = userEvent.setup();
    renderPage('admin');

    await findCard('Store details');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByText('No changes to save')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), ' Extra');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('sends only the changed fields, toasts, and updates the store cache', async () => {
    const updated = makeStore({ name: 'Fresh Mart', receipt_footer: 'New footer' });
    vi.mocked(updateCurrentStore).mockResolvedValue(updated);
    const user = userEvent.setup();
    const queryClient = renderPage('admin');

    await findCard('Store details');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Fresh Mart');
    await user.clear(screen.getByLabelText('Receipt footer'));
    await user.type(screen.getByLabelText('Receipt footer'), 'New footer');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateCurrentStore).toHaveBeenCalledWith({
        name: 'Fresh Mart',
        receipt_footer: 'New footer',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Store details saved');
    await waitFor(() => expect(queryClient.getQueryData(queryKeys.store.current)).toEqual(updated));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('keeps the values and shows the server error when saving fails', async () => {
    vi.mocked(updateCurrentStore).mockRejectedValue(new Error('Server exploded'));
    const user = userEvent.setup();
    renderPage('admin');

    await findCard('Store details');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Fresh Mart');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server exploded'));
    expect(screen.getByLabelText('Name')).toHaveValue('Fresh Mart');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('shows a pending state while saving', async () => {
    let resolveUpdate: (store: StoreResponse) => void = () => {};
    vi.mocked(updateCurrentStore).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage('admin');

    await findCard('Store details');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Fresh Mart');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled();

    await act(async () => resolveUpdate(makeStore({ name: 'Fresh Mart' })));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled(),
    );
  });

  it('restores the saved values with Reset', async () => {
    const user = userEvent.setup();
    renderPage('admin');

    await findCard('Store details');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Fresh Mart');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Name')).toHaveValue(storeFixture.name);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(updateCurrentStore).not.toHaveBeenCalled();
  });

  it('updates the receipt character counter and preview as the user types', async () => {
    const user = userEvent.setup();
    renderPage('admin');

    await findCard('Receipt');
    const footer = screen.getByLabelText('Receipt footer');

    await user.clear(footer);
    expect(screen.getByText('0 / 500 characters')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-footer-placeholder')).toBeInTheDocument();

    await user.type(footer, 'Fresh deals');
    expect(screen.getByText('11 / 500 characters')).toBeInTheDocument();
    expect(screen.queryByTestId('receipt-footer-placeholder')).not.toBeInTheDocument();

    const preview = screen.getByTestId('receipt-view');
    expect(within(preview).getByText('Fresh deals')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Corner Shop');
    expect(within(preview).getByText('Corner Shop')).toBeInTheDocument();
  });

  it('shows the store facts as read-only values', async () => {
    renderPage('admin');

    const facts = await findCard('Store facts');

    expect(within(facts).getByText('NGN')).toBeInTheDocument();
    expect(within(facts).getByText('Africa/Lagos')).toBeInTheDocument();
    expect(within(facts).getByText('Active')).toBeInTheDocument();
    expect(
      within(facts).getByText(dateTimeFormatter.format(new Date(storeFixture.created_at))),
    ).toBeInTheDocument();
    expect(
      within(facts).getByText('These were set up with the store and cannot be changed here.'),
    ).toBeInTheDocument();
    expect(within(facts).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it.each([
    ['cashier', false],
    ['manager', false],
    ['admin', true],
  ] as const)('renders the %s settings state', async (role, canEdit) => {
    renderPage(role);

    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'My account' })).toBeInTheDocument();

    const details = await findCard('Store details');

    if (canEdit) {
      expect(within(details).getByLabelText('Name')).toHaveValue(storeFixture.name);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    } else {
      expect(within(details).getByText(storeFixture.name)).toBeInTheDocument();
      expect(within(details).queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    }
  });

  it('shows loading skeletons per store card', () => {
    vi.mocked(getCurrentStore).mockReturnValue(new Promise(() => {}));

    renderPage('cashier');

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('shows a retry state when the store cannot be loaded', async () => {
    vi.mocked(getCurrentStore)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(storeFixture);
    const user = userEvent.setup();
    renderPage('admin');

    expect(await screen.findByText('Could not load store settings')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await findCard('Store details')).toBeInTheDocument();
    expect(getCurrentStore).toHaveBeenCalledTimes(2);
  });
});

describe('Settings shortcuts', () => {
  it.each([
    ['cashier', ['Payment accounts']],
    ['manager', ['Staff', 'Payment accounts']],
    ['admin', ['Staff', 'Payment accounts', 'Audit log', 'Stock reconciliation']],
  ] as const)('shows the %s shortcuts', async (role, expected) => {
    renderPage(role);

    const shortcuts = await findCard('Shortcuts');
    const all = ['Staff', 'Payment accounts', 'Audit log', 'Stock reconciliation'];
    const expectedLinks: readonly string[] = expected;

    for (const label of expectedLinks) {
      expect(within(shortcuts).getByRole('link', { name: label })).toBeInTheDocument();
    }
    for (const label of all.filter((label) => !expectedLinks.includes(label))) {
      expect(within(shortcuts).queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });

  it('uses the same hrefs as the routes', async () => {
    renderPage('admin');

    const shortcuts = await findCard('Shortcuts');

    expect(within(shortcuts).getByRole('link', { name: 'Staff' })).toHaveAttribute(
      'href',
      '/admin/staff',
    );
    expect(within(shortcuts).getByRole('link', { name: 'Payment accounts' })).toHaveAttribute(
      'href',
      '/admin/payment-accounts',
    );
    expect(within(shortcuts).getByRole('link', { name: 'Audit log' })).toHaveAttribute(
      'href',
      '/admin/audits',
    );
    expect(within(shortcuts).getByRole('link', { name: 'Stock reconciliation' })).toHaveAttribute(
      'href',
      '/admin/stock-reconciliation',
    );
  });

  it('hides the whole section when no shortcut is allowed', () => {
    render(
      <RoleProvider role={null}>
        <MemoryRouter>
          <ShortcutsCard />
        </MemoryRouter>
      </RoleProvider>,
    );

    expect(screen.queryByRole('heading', { name: 'Shortcuts' })).not.toBeInTheDocument();
  });
});
