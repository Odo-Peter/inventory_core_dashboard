import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { getActiveShift, startShift, type Shift } from '@/features/shifts/mock/shift-api';
import type { MyProfile } from '@/features/auth/interface';

const profileState = vi.hoisted(() => ({
  current: null as MyProfile | null,
}));

const shiftApi = vi.hoisted(() => ({
  getActiveShift: vi.fn(),
  startShift: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/auth/hooks/useAuthQueries', () => ({
  useMyProfile: () => ({
    data: profileState.current,
    isLoading: false,
  }),
}));

vi.mock('@/features/shifts/mock/shift-api', () => shiftApi);

const profile: MyProfile = {
  id: 'staff-1',
  name: 'Ada Okafor',
  first_name: 'Ada',
  last_name: 'Okafor',
  role: 'cashier',
  store_id: 'store-1',
  must_change_pin: false,
  active_shift_id: null,
  staff_code: 'CASHIER001',
  store_name: 'Lekki Store',
};

const openShift: Shift = {
  id: 'shift-1',
  store_id: 'store-1',
  staff_id: 'staff-1',
  clock_in_at: '2026-10-27T09:12:00.000Z',
  clock_out_at: null,
  opening_float: 150_000,
  opening_notes: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

async function openStartShiftDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Start Shift' }));
  return screen.findByRole('dialog', { name: 'Start your shift' });
}

describe('Start Shift', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileState.current = profile;
    vi.mocked(getActiveShift).mockResolvedValue(null);
  });

  it('shows the start button when no shift is open', async () => {
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'Start Shift' })).toBeInTheDocument();
  });

  it('shows the status line and hides the button when a shift is open', async () => {
    vi.mocked(getActiveShift).mockResolvedValue(openShift);
    renderDashboard();

    expect(await screen.findByText(/Shift open since/)).toBeInTheDocument();
    expect(screen.getByText('₦1,500.00')).toBeInTheDocument();
    expect(screen.getByText('CASHIER001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Shift' })).not.toBeInTheDocument();
  });

  it('shows the session identity and focuses the opening float', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const dialog = await openStartShiftDialog(user);

    expect(within(dialog).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(dialog).getByText('CASHIER001')).toBeInTheDocument();
    expect(within(dialog).getByText('Cashier')).toBeInTheDocument();
    expect(within(dialog).getByText('Lekki Store')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Clock-in time will be recorded when you confirm.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Opening float')).toHaveFocus();
  });

  it('submits kobo, locks the dialog while pending, and shows the open shift', async () => {
    const pending = deferred<Shift>();
    vi.mocked(startShift).mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderDashboard();

    const dialog = await openStartShiftDialog(user);
    await user.type(within(dialog).getByLabelText('Opening float'), '1500');
    await user.click(within(dialog).getByRole('button', { name: 'Start shift' }));

    const submitting = within(dialog).getByRole('button', { name: /Starting/ });
    expect(submitting).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(submitting).toHaveTextContent('Starting...');
    expect(startShift).toHaveBeenCalledWith('staff-1', 'store-1', {
      opening_float: 150_000,
    });

    await act(async () => {
      pending.resolve({ ...openShift, opening_float: 150_000 });
      await pending.promise;
    });

    expect(toast.success).toHaveBeenCalledWith('Shift started');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/Shift open since/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Shift' })).not.toBeInTheDocument();
  });

  it('ignores a second submit while the request is pending', async () => {
    const pending = deferred<Shift>();
    vi.mocked(startShift).mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderDashboard();

    const dialog = await openStartShiftDialog(user);
    await user.type(within(dialog).getByLabelText('Opening float'), '1500');
    await user.click(within(dialog).getByRole('button', { name: 'Start shift' }));

    const form = dialog.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(startShift).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(openShift);
      await pending.promise;
    });
  });

  it('keeps the dialog open and surfaces the thrown error', async () => {
    vi.mocked(startShift).mockRejectedValue(new Error('Shift service unavailable'));
    const user = userEvent.setup();
    renderDashboard();

    const dialog = await openStartShiftDialog(user);
    await user.type(within(dialog).getByLabelText('Opening float'), '1000');
    await user.click(within(dialog).getByRole('button', { name: 'Start shift' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Shift service unavailable');
    });
    expect(screen.getByRole('dialog', { name: 'Start your shift' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start shift' })).toBeEnabled();
  });
});
