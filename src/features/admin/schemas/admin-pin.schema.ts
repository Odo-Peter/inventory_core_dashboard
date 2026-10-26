import { z } from 'zod';

export const adminPinSchema = z.object({
  acting_pin: z.string().min(1, 'Enter your PIN').regex(/^\d+$/, 'PIN must contain digits only'),
});

export type AdminPinValues = z.infer<typeof adminPinSchema>;
