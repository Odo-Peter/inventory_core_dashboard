import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffLoginPage } from '@/features/auth/pages/staff-login-page';
import { login } from '@/features/auth/services/auth.service';
import type { AuthTokenResponse } from '@/features/auth/interface';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  login: vi.fn(),
}));

const tokenResponse: AuthTokenResponse = {
  access_token: 'issued.jwt.token',
  token_type: 'Bearer',
  expires_in: 3600,
  staff: {
    id: 'staff-1',
    name: 'Ada Lovelace',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'cashier',
    store_id: 'store-1',
    must_change_pin: false,
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<StaffLoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillStaffCode(user: ReturnType<typeof userEvent.setup>, code = 'STAFF01') {
  await user.type(screen.getByPlaceholderText('Enter staff code'), code);
}

describe('StaffLoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the store identity and login instructions', () => {
    const { container } = renderPage();

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.getByText('Enter your PIN to start your shift.')).toBeInTheDocument();
    expect(screen.getByText('Store: Main')).toBeInTheDocument();
    expect(container.querySelector('img[src="/logo.svg"]')).toBeInTheDocument();
  });

  it('renders a masked numeric PIN input by default', () => {
    renderPage();

    const input = screen.getByLabelText(/^PIN$/);

    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  it('toggles PIN visibility with the eye button', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/^PIN$/);
    const showButton = screen.getByRole('button', { name: 'Show' });

    expect(showButton).toHaveAttribute('aria-pressed', 'false');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(showButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(input).toHaveAttribute('type', 'password');
  });

  it('blocks submission when the PIN contains non-numeric characters', async () => {
    const user = userEvent.setup();
    renderPage();

    await fillStaffCode(user);
    await user.type(screen.getByLabelText(/^PIN$/), '12ab34');

    const pinInput = screen.getByLabelText(/^PIN$/);
    expect(pinInput).toHaveAttribute('pattern', '[0-9]*');
    expect(pinInput).not.toBeValid();

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(login).not.toHaveBeenCalled();
  });

  it('shows accessible errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Staff code is required')).toBeInTheDocument();
    expect(screen.getByText('Pin must be exactly 6 digits')).toBeInTheDocument();
    expect(screen.getByLabelText(/^PIN$/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^PIN$/)).toHaveAttribute('aria-describedby', 'pin-error');
    expect(screen.getByLabelText('Staff Code')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Staff Code')).toHaveAttribute(
      'aria-describedby',
      'staff-code-error',
    );
  });

  it('rejects a PIN that is not exactly six digits', async () => {
    const user = userEvent.setup();
    renderPage();

    await fillStaffCode(user);
    await user.type(screen.getByLabelText(/^PIN$/), '12');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Pin must be exactly 6 digits')).toBeInTheDocument();
  });

  it('clears the staff code error when the user starts typing again', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Staff code is required')).toBeInTheDocument();

    await fillStaffCode(user);

    expect(screen.queryByText('Staff code is required')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Staff Code')).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows a loading state and navigates to the dashboard on success', async () => {
    let resolveLogin: (value: AuthTokenResponse) => void = () => {};
    vi.mocked(login).mockImplementation(
      () =>
        new Promise<AuthTokenResponse>((resolve) => {
          resolveLogin = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPage();

    await fillStaffCode(user);
    await user.type(screen.getByLabelText(/^PIN$/), '123456');

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(within(submitButton).getByRole('status')).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Signing in...');

    await act(async () => {
      resolveLogin(tokenResponse);
    });

    expect(
      await screen.findByText('Dashboard destination', undefined, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(vi.mocked(login)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(login).mock.calls[0][0]).toEqual({ staff_code: 'STAFF01', pin: '123456' });
  });
});
