import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffAccessPage } from '@/features/admin/staff/pages/staff-access-page';
import { createStaff, listStaff, updateStaff } from '@/features/admin/services/admin.service';
import {
  createdStaffResponse,
  makeStaff,
  openStaffRowActions,
  replacePhoneNumber,
  staffFixtures,
} from '../../helpers/staff';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StaffAccessPage />
    </QueryClientProvider>,
  );

  return queryClient;
}

async function fillNewStaffForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First name'), 'Chidi');
  await user.type(screen.getByLabelText('Last name'), 'Nwosu');
  await user.type(screen.getByLabelText('Phone number'), '8055550199');
}

async function chooseRole(user: ReturnType<typeof userEvent.setup>, nextRole: string) {
  await user.click(screen.getByRole('combobox', { name: 'Role' }));
  await user.click(await screen.findByRole('option', { name: nextRole }));
}

describe('StaffAccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists staff returned by the staff service', async () => {
    vi.mocked(listStaff).mockResolvedValue(staffFixtures);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Staff & Access', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('Ada Okafor')).toBeInTheDocument();
    expect(screen.getByText('5 members · 4 active · 1 locked')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('PIN')).toBeInTheDocument();
    expect(listStaff).toHaveBeenCalledTimes(1);
  });

  it('creates a staff account, shows its temporary credentials, and refreshes the list', async () => {
    vi.mocked(listStaff)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdStaffResponse.staff]);
    vi.mocked(createStaff).mockResolvedValue(createdStaffResponse);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('No staff members found.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Staff' }));
    expect(await screen.findByRole('heading', { name: 'Add staff' })).toBeInTheDocument();

    await fillNewStaffForm(user);
    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    const createdDialog = await screen.findByRole('dialog', { name: 'Staff account created' });
    expect(within(createdDialog).getByText('Staff account created')).toBeInTheDocument();
    expect(within(createdDialog).getByText('Chidi Nwosu')).toBeInTheDocument();
    expect(within(createdDialog).getByText('CASHIER003')).toBeInTheDocument();
    expect(within(createdDialog).getByText('482913')).toBeInTheDocument();

    expect(createStaff).toHaveBeenCalledWith({
      first_name: 'Chidi',
      last_name: 'Nwosu',
      phone: '+2348055550199',
      role: 'cashier',
    });
    expect(toast.success).toHaveBeenCalledWith('Chidi Nwosu added successfully');

    await user.click(within(createdDialog).getByRole('button', { name: 'Done' }));

    expect(await screen.findByText('Chidi Nwosu')).toBeInTheDocument();
    expect(screen.getByText('CASHIER003')).toBeInTheDocument();
    expect(screen.getByText('1 member · 1 active')).toBeInTheDocument();
    expect(listStaff).toHaveBeenCalledTimes(2);
  });

  it('edits staff profile details and refreshes the listing', async () => {
    const updatedStaff = makeStaff({
      first_name: 'Adaeze',
      name: 'Adaeze Okafor',
      phone: '+2348055550100',
      role: 'manager',
      updated_at: '2026-10-27T10:00:00.000Z',
    });
    const updatedList = [updatedStaff, ...staffFixtures.slice(1)];
    vi.mocked(listStaff).mockResolvedValueOnce(staffFixtures).mockResolvedValueOnce(updatedList);
    vi.mocked(updateStaff).mockResolvedValue(updatedStaff);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Ada Okafor')).toBeInTheDocument();
    const menu = await openStaffRowActions(user, 'Ada Okafor');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));

    expect(await screen.findByRole('heading', { name: 'Edit staff' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('First name'));
    await user.type(screen.getByLabelText('First name'), 'Adaeze');
    await replacePhoneNumber(user, '8055550100');
    await chooseRole(user, 'Manager');
    await user.click(screen.getByRole('button', { name: 'Update Staff' }));

    await waitFor(() => {
      expect(updateStaff).toHaveBeenCalledWith('staff-1', {
        first_name: 'Adaeze',
        last_name: 'Okafor',
        phone: '+2348055550100',
        role: 'manager',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Staff "Adaeze Okafor" updated successfully');

    expect(await screen.findByText('Adaeze Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Ada Okafor')).not.toBeInTheDocument();

    const updatedRow = screen.getByText('Adaeze Okafor').closest('tr');
    expect(updatedRow).not.toBeNull();
    expect(within(updatedRow as HTMLElement).getByText('Manager')).toBeInTheDocument();
    expect(within(updatedRow as HTMLElement).getByText('+2348055550100')).toBeInTheDocument();
    expect(listStaff).toHaveBeenCalledTimes(2);
  });

  it('shows staff details from the selected row', async () => {
    vi.mocked(listStaff).mockResolvedValue(staffFixtures);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Arinze Eze')).toBeInTheDocument();
    const menu = await openStaffRowActions(user, 'Arinze Eze');
    await user.click(within(menu).getByRole('menuitem', { name: 'View details' }));

    expect(await screen.findByRole('heading', { name: 'Staff details' })).toBeInTheDocument();
    const detailsDialog = screen.getByRole('dialog', { name: 'Staff details' });
    expect(within(detailsDialog).getAllByText('ADMIN001')).toHaveLength(2);
    expect(within(detailsDialog).getByText('+2348031234568')).toBeInTheDocument();
    expect(within(detailsDialog).getByText('Up to date')).toBeInTheDocument();
  });

  it('keeps reset PIN and delete as non-mutating placeholders', async () => {
    vi.mocked(listStaff).mockResolvedValue(staffFixtures);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Ada Okafor')).toBeInTheDocument();

    const resetMenu = await openStaffRowActions(user, 'Ada Okafor');
    await user.click(within(resetMenu).getByRole('menuitem', { name: 'Reset PIN' }));

    expect(toast.info).toHaveBeenCalledWith('PIN reset is a placeholder', {
      description: 'No changes were made to Ada Okafor.',
    });

    const deleteMenu = await openStaffRowActions(user, 'Ada Okafor');
    await user.click(within(deleteMenu).getByRole('menuitem', { name: 'Delete' }));

    expect(toast.warning).toHaveBeenCalledWith('Delete is not wired up yet', {
      description: 'Ada Okafor was not removed.',
    });
    expect(screen.getByText('Ada Okafor')).toBeInTheDocument();
    expect(listStaff).toHaveBeenCalledTimes(1);
  });
});
