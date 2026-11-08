import { z } from 'zod';

import { PAYMENT_METHODS } from '../types';

export const checkoutSchema = z
  .object({
    payment_method: z.enum(PAYMENT_METHODS),
    pos_account_id: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.payment_method !== 'cash' && !values.pos_account_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['pos_account_id'],
        message: 'Choose an account for this payment method',
      });
    }
  });

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutFormValues = z.output<typeof checkoutSchema>;
