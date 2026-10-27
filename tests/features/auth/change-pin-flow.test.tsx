import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffLoginPage } from '@/features/auth/pages/staff-login-page';
import { login } from '@/features/auth/services/auth.service';
import type { AuthTokenResponse } from '@/features/auth/interface';
import { AuthProvider } from '@/features/auth/provider/AuthProvider';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
  changePin: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

function renderPageWithDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<StaffLoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Forced PIN change on login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('opens blocking Change PIN dialog when must_change_pin is true and keeps user on auth boundary until completed', async () => {
    const response: AuthTokenResponse = {
      access_token: 'issued.jwt.token',
      token_type: 'Bearer',
      expires_in: 3600,
      staff: {
        id: 'staff-2',
        name: 'Micheal Baraka',
        first_name: 'Micheal',
        last_name: 'Baraka',
        role: 'manager',
        store_id: '3f3f0694-11f0-4d01-ab15-e427383e7b49',
        must_change_pin: true,
      },
    };

    vi.mocked(login).mockResolvedValue(response);
    const user = userEvent.setup();
    renderPageWithDashboard();

    await user.type(screen.getByPlaceholderText('Enter staff code'), 'STAFF02');
    await user.type(screen.getByLabelText(/^PIN$/), '123456');
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Change your PIN')).toBeInTheDocument();
    expect(screen.getByText(/must replace the temporary PIN/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard destination')).not.toBeInTheDocument();

    const closeBtn = screen.queryByRole('button', { name: /close/i });
    expect(closeBtn).not.toBeInTheDocument();
  });

  it('validates change PIN form rules (different pins, matching confirm)', async () => {
    const response: AuthTokenResponse = {
      access_token: 'issued.jwt.token',
      token_type: 'Bearer',
      expires_in: 3600,
      staff: {
        id: 'staff-2',
        name: 'Micheal Baraka',
        first_name: 'Micheal',
        last_name: 'Baraka',
        role: 'manager',
        store_id: 'store-1',
        must_change_pin: true,
      },
    };

    vi.mocked(login).mockResolvedValue(response);
    const user = userEvent.setup();
    renderPageWithDashboard();

    await user.type(screen.getByPlaceholderText('Enter staff code'), 'STAFF02');
    await user.type(screen.getByLabelText(/^PIN$/), '123456');
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    await screen.findByRole('dialog');

    const temp = screen.getByLabelText(/^Temporary PIN$/);
    const newPin = screen.getByLabelText(/^New PIN$/);
    const confirm = screen.getByLabelText(/^Confirm new PIN$/);

    await user.type(temp, '123456');
    await user.type(newPin, '123456');
    await user.type(confirm, '123456');
    await user.click(screen.getByRole('button', { name: /Update PIN/i }));

    expect(
      await screen.findByText('New PIN must be different from temporary PIN'),
    ).toBeInTheDocument();
  });

  it('completes PIN change locally and navigates to dashboard', async () => {
    const response: AuthTokenResponse = {
      access_token: 'issued.jwt.token',
      token_type: 'Bearer',
      expires_in: 3600,
      staff: {
        id: 'staff-2',
        name: 'Micheal Baraka',
        first_name: 'Micheal',
        last_name: 'Baraka',
        role: 'manager',
        store_id: 'store-1',
        must_change_pin: true,
      },
    };

    vi.mocked(login).mockResolvedValue(response);
    const user = userEvent.setup();
    renderPageWithDashboard();

    await user.type(screen.getByPlaceholderText('Enter staff code'), 'STAFF02');
    await user.type(screen.getByLabelText(/^PIN$/), '123456');
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    await screen.findByRole('dialog');

    const temp = screen.getByLabelText(/^Temporary PIN$/);
    const newPin = screen.getByLabelText(/^New PIN$/);
    const confirm = screen.getByLabelText(/^Confirm new PIN$/);

    await user.type(temp, '123456');
    await user.type(newPin, '654321');
    await user.type(confirm, '654321');

    const updateBtn = screen.getByRole('button', { name: /Update PIN/i });
    await user.click(updateBtn);

    await waitFor(
      () => {
        expect(screen.getByText('Dashboard destination')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
