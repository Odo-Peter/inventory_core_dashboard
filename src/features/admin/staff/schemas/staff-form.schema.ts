import { z } from 'zod';

export const staffFormSchema = z.object({
  staff_code: z
    .string()
    .trim()
    .min(1, 'Staff code is required')
    .max(24, 'Staff code must be 24 characters or fewer')
    .transform((value) => value.toUpperCase()),
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'First name must be 60 characters or fewer'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name must be 60 characters or fewer'),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(20, 'Phone number must be 20 characters or fewer'),
  role: z.enum(['cashier', 'manager', 'admin'], {
    error: 'Select a role',
  }),
});

export type StaffFormInput = z.input<typeof staffFormSchema>;
export type StaffFormValues = z.output<typeof staffFormSchema>;
