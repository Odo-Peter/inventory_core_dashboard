import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/router';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(<RouterProvider router={router} />);
}

describe('app router', () => {
  it('renders the staff login screen at / without app chrome', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Inventory Dashboard')).not.toBeInTheDocument();
  });

  it('renders the dashboard inside the app shell', () => {
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
    renderAt('/dashboard');

    await user.click(screen.getByRole('link', { name: 'Back to login' }));

    expect(screen.getByRole('heading', { name: 'Staff Login' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
