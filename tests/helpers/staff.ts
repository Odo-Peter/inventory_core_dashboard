import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Staff } from '@/features/admin/staff/types';

type User = ReturnType<typeof userEvent.setup>;

const defaultStaff: Staff = {
  id: 'staff-1',
  store_id: 'store-1',
  staff_code: 'CASHIER001',
  first_name: 'Ada',
  last_name: 'Okafor',
  phone: '+2348031234567',
  name: 'Ada Okafor',
  role: 'cashier',
  active: true,
  must_change_pin: false,
  is_locked: false,
  created_at: '2026-10-25T17:41:37.326Z',
  updated_at: '2026-10-25T21:23:23.589Z',
};

export function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return { ...defaultStaff, ...overrides };
}

export const staffFixtures: Staff[] = [
  defaultStaff,
  makeStaff({
    id: 'staff-2',
    staff_code: 'ADMIN001',
    first_name: 'Arinze',
    last_name: 'Eze',
    name: 'Arinze Eze',
    phone: '+2348031234568',
    role: 'admin',
    updated_at: '2026-10-26T12:06:35.395Z',
  }),
  makeStaff({
    id: 'staff-3',
    staff_code: 'MANAGER001',
    first_name: 'Kojo',
    last_name: 'Mensah',
    name: 'Kojo Mensah',
    phone: '+2348067890123',
    role: 'manager',
    must_change_pin: true,
    created_at: '2026-09-14T09:12:08.112Z',
    updated_at: '2026-10-26T08:45:11.204Z',
  }),
  makeStaff({
    id: 'staff-4',
    staff_code: 'CASHIER002',
    first_name: 'Esi',
    last_name: 'Adjei',
    name: 'Esi Adjei',
    phone: '+2347012345678',
    active: false,
    created_at: '2026-08-02T13:05:42.882Z',
    updated_at: '2026-10-21T16:30:09.456Z',
  }),
  makeStaff({
    id: 'staff-5',
    staff_code: 'MANAGER002',
    first_name: 'Tunde',
    last_name: 'Bello',
    name: 'Tunde Bello',
    phone: '+2348098765432',
    role: 'manager',
    is_locked: true,
    created_at: '2026-07-19T11:48:23.001Z',
    updated_at: '2026-10-24T19:02:14.778Z',
  }),
];

export const createdStaffResponse = {
  staff: makeStaff({
    id: 'staff-6',
    staff_code: 'CASHIER003',
    first_name: 'Chidi',
    last_name: 'Nwosu',
    name: 'Chidi Nwosu',
    phone: '+2348055550199',
    created_at: '2026-10-27T09:00:00.000Z',
    updated_at: '2026-10-27T09:00:00.000Z',
    must_change_pin: true,
  }),
  temporary_pin: '482913',
};

export async function openStaffRowActions(user: User, staffName: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${staffName}` }));
  return screen.findByRole('menu');
}

export async function replacePhoneNumber(user: User, value: string) {
  const phone = screen.getByLabelText('Phone number') as HTMLInputElement;
  const digitCount = phone.value.replace(/\D/g, '').length;

  await user.click(phone);
  await user.keyboard('{End}');
  if (digitCount > 0) {
    await user.keyboard(`{Backspace>${digitCount}/}`);
  }
  await user.type(phone, value);

  return phone;
}
