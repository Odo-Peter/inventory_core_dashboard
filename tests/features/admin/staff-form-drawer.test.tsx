import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffFormDrawer } from '@/features/admin/staff/components/staff-form-drawer';
import { createStaff, updateStaff } from '@/features/admin/services/admin.service';
import type { Staff } from '@/features/admin/staff/types';
import { createdStaffResponse, makeStaff, replacePhoneNumber } from '../../helpers/staff';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
}));

interface RenderDrawerOptions {
  mode?: 'add' | 'edit';
  staff?: Staff | null;
}

function renderDrawer({ mode = 'add', staff = null }: RenderDrawerOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onCreated = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <StaffFormDrawer
        open
        onOpenChange={onOpenChange}
        mode={mode}
        staff={staff}
        onCreated={onCreated}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onCreated, queryClient };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First name'), 'Chidi');
  await user.type(screen.getByLabelText('Last name'), 'Nwosu');
  await user.type(screen.getByLabelText('Phone number'), '8055550199');
}

async function chooseRole(user: ReturnType<typeof userEvent.setup>, nextRole: string) {
  await user.click(screen.getByRole('combobox', { name: 'Role' }));
  await user.click(await screen.findByRole('option', { name: nextRole }));
}

describe('StaffFormDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required-field errors and does not create an empty staff record', async () => {
    const user = userEvent.setup();
    renderDrawer();

    expect(await screen.findByRole('heading', { name: 'Add staff' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(createStaff).not.toHaveBeenCalled();
  });

  it('creates a staff member and exposes the generated login details', async () => {
    vi.mocked(createStaff).mockResolvedValue(createdStaffResponse);
    const user = userEvent.setup();
    const { onCreated, onOpenChange } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add staff' });
    await fillRequiredFields(user);
    await chooseRole(user, 'Manager');
    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    await waitFor(() => {
      expect(createStaff).toHaveBeenCalledWith({
        first_name: 'Chidi',
        last_name: 'Nwosu',
        phone: '+2348055550199',
        role: 'manager',
      });
    });
    expect(onCreated).toHaveBeenCalledWith({
      name: 'Chidi Nwosu',
      staff_code: 'CASHIER003',
      temporary_pin: '482913',
    });
    expect(toast.success).toHaveBeenCalledWith('Chidi Nwosu added successfully');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('prefills an existing staff member and submits edited profile details', async () => {
    const original = makeStaff();
    const updated = makeStaff({
      last_name: 'Nwosu',
      name: 'Ada Nwosu',
      phone: '+2348055550100',
      role: 'manager',
    });
    vi.mocked(updateStaff).mockResolvedValue(updated);
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer({ mode: 'edit', staff: original });

    expect(await screen.findByRole('heading', { name: 'Edit staff' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Ada');
    expect(screen.getByLabelText('Last name')).toHaveValue('Okafor');
    expect(
      (screen.getByLabelText('Phone number') as HTMLInputElement).value.replace(/\D/g, ''),
    ).toBe('2348031234567');
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent('Cashier');

    await user.clear(screen.getByLabelText('Last name'));
    await user.type(screen.getByLabelText('Last name'), 'Nwosu');
    const phone = await replacePhoneNumber(user, '8055550100');
    expect(phone.value.replace(/\D/g, '')).toBe('2348055550100');
    await chooseRole(user, 'Manager');
    await user.click(screen.getByRole('button', { name: 'Update Staff' }));

    await waitFor(() => {
      expect(updateStaff).toHaveBeenCalledWith('staff-1', {
        first_name: 'Ada',
        last_name: 'Nwosu',
        phone: '+2348055550100',
        role: 'manager',
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Staff "Ada Nwosu" updated successfully');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the drawer open and reports when saving fails', async () => {
    vi.mocked(createStaff).mockRejectedValue(new Error('Staff account could not be created'));
    const user = userEvent.setup();
    const { onCreated, onOpenChange } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add staff' });
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Save Staff' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Staff account could not be created');
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('closes without creating a staff member when cancelled', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    await screen.findByRole('heading', { name: 'Add staff' });
    await user.type(screen.getByLabelText('First name'), 'Chidi');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createStaff).not.toHaveBeenCalled();
  });
});
