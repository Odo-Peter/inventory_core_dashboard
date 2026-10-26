import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignInForm from '@/features/auth/form/sign-in-form';
import { login } from '@/features/auth/services/auth.service';
import type { AuthTokenResponse } from '@/features/auth/interface';
import { TOKEN_STORAGE_KEY } from '@/lib/token';

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

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SignInForm />} />
          <Route path="/dashboard" element={<div>Dashboard destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignInForm success flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores the token, shows a success toast and navigates to the dashboard', async () => {
    vi.mocked(login).mockResolvedValue(tokenResponse);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText('Enter staff code'), 'STAFF01');
    await user.type(screen.getByPlaceholderText('*******'), '123456');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(
      await screen.findByText('Dashboard destination', undefined, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('issued.jwt.token');
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Signed in successfully');
  });
});
