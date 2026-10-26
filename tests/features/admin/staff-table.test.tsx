import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StaffTable } from '@/features/admin/staff/components/staff-table';
import { openStaffRowActions, staffFixtures } from '../../helpers/staff';

function renderTable(staff = staffFixtures) {
  const callbacks = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onResetPin: vi.fn(),
    onDeactivate: vi.fn(),
    onReactivate: vi.fn(),
  };

  render(<StaffTable staff={staff} {...callbacks} />);

  return callbacks;
}

describe('StaffTable', () => {
  it('lists staff with contact, role, status, and access details', () => {
    renderTable();

    expect(screen.getByText('5 members · 4 active · 1 locked')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Staff' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Phone' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Updated' })).toBeInTheDocument();

    const adaRow = screen.getByText('Ada Okafor').closest('tr');
    expect(adaRow).not.toBeNull();
    expect(within(adaRow as HTMLElement).getByText('CASHIER001')).toBeInTheDocument();
    expect(within(adaRow as HTMLElement).getByText('+2348031234567')).toBeInTheDocument();
    expect(within(adaRow as HTMLElement).getByText('Cashier')).toBeInTheDocument();
    expect(within(adaRow as HTMLElement).getByText('Active')).toBeInTheDocument();

    expect(screen.getAllByText('Cashier')).toHaveLength(2);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('PIN')).toHaveAttribute('title', 'PIN change required');
  });

  it('shows a clear empty state and zero summary', () => {
    renderTable([]);

    expect(screen.getByText('0 members · 0 active')).toBeInTheDocument();
    expect(screen.getByText('No staff members found.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
  });

  it.each([
    ['View details', 'onView'],
    ['Edit', 'onEdit'],
    ['Reset PIN', 'onResetPin'],
    ['Deactivate', 'onDeactivate'],
  ] as const)(
    'invokes the %s row action for the selected staff member',
    async (action, callback) => {
      const user = userEvent.setup();
      const callbacks = renderTable();

      const menu = await openStaffRowActions(user, 'Kojo Mensah');
      await user.click(within(menu).getByRole('menuitem', { name: action }));

      expect(callbacks[callback]).toHaveBeenCalledTimes(1);
      expect(callbacks[callback]).toHaveBeenCalledWith(
        expect.objectContaining({
          staff_code: 'MANAGER001',
          name: 'Kojo Mensah',
        }),
      );
    },
  );

  it('invokes the Activate row action for an inactive staff member', async () => {
    const user = userEvent.setup();
    const callbacks = renderTable();

    const menu = await openStaffRowActions(user, 'Esi Adjei');
    await user.click(within(menu).getByRole('menuitem', { name: 'Activate' }));

    expect(callbacks.onReactivate).toHaveBeenCalledTimes(1);
    expect(callbacks.onReactivate).toHaveBeenCalledWith(
      expect.objectContaining({
        staff_code: 'CASHIER002',
        name: 'Esi Adjei',
        active: false,
      }),
    );
  });

  it('scopes each row action menu to the staff member that opened it', async () => {
    const user = userEvent.setup();
    const callbacks = renderTable();

    const adaMenu = await openStaffRowActions(user, 'Ada Okafor');
    await user.click(within(adaMenu).getByRole('menuitem', { name: 'Edit' }));

    expect(callbacks.onEdit).toHaveBeenLastCalledWith(
      expect.objectContaining({ staff_code: 'CASHIER001', name: 'Ada Okafor' }),
    );

    const arinzeMenu = await openStaffRowActions(user, 'Arinze Eze');
    await user.click(within(arinzeMenu).getByRole('menuitem', { name: 'Edit' }));

    expect(callbacks.onEdit).toHaveBeenLastCalledWith(
      expect.objectContaining({ staff_code: 'ADMIN001', name: 'Arinze Eze' }),
    );
  });
});
