import { z } from 'zod';

export const signInFormSchema = z.object({
  code: z.string().min(1, 'Staff code is required'),
  pin: z
    .string()
    .length(6, 'Pin must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Pin must contain only numbers'),
});

export type SignInFormInput = z.input<typeof signInFormSchema>;
export type SignInValues = z.output<typeof signInFormSchema>;
