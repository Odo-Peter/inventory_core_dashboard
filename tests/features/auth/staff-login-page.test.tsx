import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { StaffLoginPage } from '@/features/auth/pages/staff-login-page';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<StaffLoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('StaffLoginPage', () => {
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
    const showButton = screen.getByRole('button', { name: 'Show PIN' });

    expect(showButton).toHaveAttribute('aria-pressed', 'false');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(showButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide PIN' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Hide PIN' }));

    expect(input).toHaveAttribute('type', 'password');
  });

  it('strips non-numeric characters from the PIN', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/^PIN$/);
    await user.type(input, '12ab34');

    expect(input).toHaveValue('1234');
  });

  it('shows an accessible error when submitting an empty PIN', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Sign In & Clock In' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter your PIN to continue.');
    expect(screen.getByLabelText(/^PIN$/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^PIN$/)).toHaveAttribute('aria-describedby', 'pin-error');
  });

  it('rejects a PIN with fewer than four digits', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^PIN$/), '12');
    await user.click(screen.getByRole('button', { name: 'Sign In & Clock In' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid PIN format.');
  });

  it('clears the error when the user starts typing again', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Sign In & Clock In' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^PIN$/), '1');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^PIN$/)).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows a loading state and navigates to the dashboard on success', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^PIN$/), '1234');

    const submitButton = screen.getByRole('button', { name: 'Sign In & Clock In' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(within(submitButton).getByRole('status')).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Signing in...');

    expect(
      await screen.findByText('Dashboard destination', undefined, { timeout: 2000 }),
    ).toBeInTheDocument();
  });
});
