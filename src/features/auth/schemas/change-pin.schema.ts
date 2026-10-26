import { z } from 'zod';

export const changePinFormSchema = z
  .object({
    temporaryPin: z
      .string()
      .min(1, 'Temporary PIN is required')
      .length(6, 'PIN must be exactly 6 digits')
      .regex(/^\d{6}$/, 'PIN must contain only numbers'),
    newPin: z
      .string()
      .min(1, 'New PIN is required')
      .length(6, 'PIN must be exactly 6 digits')
      .regex(/^\d{6}$/, 'PIN must contain only numbers'),
    confirmPin: z
      .string()
      .min(1, 'Confirm PIN is required')
      .length(6, 'PIN must be exactly 6 digits')
      .regex(/^\d{6}$/, 'PIN must contain only numbers'),
  })
  .refine((data) => data.newPin !== data.temporaryPin, {
    message: 'New PIN must be different from temporary PIN',
    path: ['newPin'],
  })
  .refine((data) => data.confirmPin === data.newPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

export type ChangePinFormInput = z.input<typeof changePinFormSchema>;
export type ChangePinValues = z.output<typeof changePinFormSchema>;
