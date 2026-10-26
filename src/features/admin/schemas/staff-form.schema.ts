import { z } from 'zod';

export const staffFormSchema = z.object({
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
    .min(1, 'Phone number is required')
    .regex(/^234[789][01]\d{8}$/, 'Enter a valid Nigerian mobile number')
    .transform((value) => `+${value}`),
  role: z.enum(['cashier', 'manager', 'admin'], {
    error: 'Select a role',
  }),
});

export const staffUpdateSchema = staffFormSchema.partial();

export type StaffFormInput = z.input<typeof staffFormSchema>;
export type StaffFormValues = z.output<typeof staffFormSchema>;
export type StaffUpdateValues = z.output<typeof staffUpdateSchema>;
