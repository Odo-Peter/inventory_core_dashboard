export type StaffRole = 'cashier' | 'manager' | 'admin';

export interface Staff {
  id: string;
  store_id: string;
  staff_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  name: string;
  role: StaffRole;
  active: boolean;
  must_change_pin: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export const staffRoleLabels: Record<StaffRole, string> = {
  cashier: 'Cashier',
  manager: 'Manager',
  admin: 'Admin',
};

export const staffRoleOptions = [
  { value: 'cashier', label: staffRoleLabels.cashier },
  { value: 'manager', label: staffRoleLabels.manager },
  { value: 'admin', label: staffRoleLabels.admin },
] as const;

export interface StaffResponse {
  staff: Staff;
  temporary_pin: string;
}

export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  currency: string;
  timezone: string;
  receipt_footer: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
