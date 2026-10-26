import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { StaffAccessPage } from '@/features/admin/staff/pages/staff-access-page';

async function openRowActions(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${name}` }));
  return screen.findByRole('menu');
}

describe('StaffAccessPage', () => {
  it('renders the staff table with roles, statuses, and access indicators', () => {
    render(<StaffAccessPage />);

    expect(screen.getByRole('heading', { name: 'Staff & Access', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('5 members · 4 active · 1 locked')).toBeInTheDocument();
    expect(screen.getByText('Ada Okafor')).toBeInTheDocument();
    expect(screen.getByText('CASHIER001')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('PIN')).toBeInTheDocument();
  });

  it('validates required fields before saving a new staff member', async () => {
    const user = userEvent.setup();
    render(<StaffAccessPage />);

    await user.click(screen.getByRole('button', { name: 'Add Staff' }));
    expect(await screen.findByRole('heading', { name: 'Add staff' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    expect(await screen.findByText('Staff code is required')).toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
  });

  it('adds a staff member locally and closes the drawer', async () => {
    const user = userEvent.setup();
    render(<StaffAccessPage />);

    await user.click(screen.getByRole('button', { name: 'Add Staff' }));
    await screen.findByRole('heading', { name: 'Add staff' });

    await user.type(screen.getByLabelText('Staff code'), 'cashier003');
    await user.type(screen.getByLabelText('First name'), 'Chidi');
    await user.type(screen.getByLabelText('Last name'), 'Nwosu');
    await user.type(screen.getByLabelText('Phone number'), '+234 805 555 0199');
    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    expect(await screen.findByText('Chidi Nwosu')).toBeInTheDocument();
    expect(screen.getByText('CASHIER003')).toBeInTheDocument();
    expect(screen.getByText('6 members · 5 active · 1 locked')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add staff' })).not.toBeInTheDocument();
    });
  });

  it('prefills and updates an existing staff member', async () => {
    const user = userEvent.setup();
    render(<StaffAccessPage />);

    const menu = await openRowActions(user, 'Ada Okafor');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));

    expect(await screen.findByRole('heading', { name: 'Edit staff' })).toBeInTheDocument();
    const firstName = screen.getByLabelText('First name');
    expect(firstName).toHaveValue('Ada');

    await user.clear(firstName);
    await user.type(firstName, 'Adaeze');
    await user.click(screen.getByRole('button', { name: 'Update Staff' }));

    expect(await screen.findByText('Adaeze Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Ada Okafor')).not.toBeInTheDocument();
  });

  it('shows full profile and access details in the view drawer', async () => {
    const user = userEvent.setup();
    render(<StaffAccessPage />);

    const menu = await openRowActions(user, 'Arinze Eze');
    await user.click(within(menu).getByRole('menuitem', { name: 'View details' }));

    expect(await screen.findByRole('heading', { name: 'Staff details' })).toBeInTheDocument();
    expect(screen.getByText('877358ee-f677-4f65-b221-d487fb013832')).toBeInTheDocument();
    expect(screen.getByText('3f3f0694-11f0-4d01-ab15-e427383e7b49')).toBeInTheDocument();
    expect(screen.getByText('Up to date')).toBeInTheDocument();
  });
});
