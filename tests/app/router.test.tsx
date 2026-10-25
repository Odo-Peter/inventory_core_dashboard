import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { routes } from '@/app/router';
import { TOKEN_STORAGE_KEY } from '@/lib/token';
import { createToken } from '../helpers/token';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function authenticate(expiresInSeconds = 3600) {
  localStorage.setItem(TOKEN_STORAGE_KEY, createToken(expiresInSeconds));
}

afterEach(() => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
});

describe('app router', () => {
  it('renders the staff login screen at / without app chrome', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Inventory Dashboard')).not.toBeInTheDocument();
  });

  it('redirects an authenticated visitor away from the sign-in screen', () => {
    authenticate();
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('redirects to the sign-in screen when no token is present', () => {
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('redirects to the sign-in screen when the token is expired', () => {
    authenticate(-60);
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the dashboard inside the app shell', () => {
    authenticate();
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['/inventory', 'Inventory'],
    ['/pos', 'POS'],
    ['/settings', 'Settings'],
  ])('renders the %s route', (path, heading) => {
    authenticate();
    renderAt(path);

    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the not-found state for an unknown route', async () => {
    const user = userEvent.setup();
    renderAt('/missing-page');

    expect(screen.getByRole('status')).toHaveTextContent('Not found');
    expect(screen.getByText("This page doesn't exist.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
  });

  it('navigates from the dashboard back to login', async () => {
    const user = userEvent.setup();
    authenticate();
    renderAt('/dashboard');

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    await user.click(screen.getByRole('link', { name: 'Back to login' }));

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
