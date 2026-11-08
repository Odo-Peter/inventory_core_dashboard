import { z } from 'zod';
import { parseNairaToKobo } from '@/lib/money';

const MAX_KOBO = 2_147_483_647;

export const adminEndShiftSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Enter a closing reason')
    .max(500, 'Reason must be 500 characters or fewer'),

  closing_cash_counted: z
    .string()
    .trim()
    .min(1, 'Enter the closing cash amount')
    .transform((value, ctx) => {
      if (value.startsWith('-')) {
        ctx.addIssue({ code: 'custom', message: 'Cannot be negative' });
        return z.NEVER;
      }

      const kobo = parseNairaToKobo(value);

      if (kobo === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid amount with up to 2 decimal places',
        });
        return z.NEVER;
      }

      if (kobo > MAX_KOBO) {
        ctx.addIssue({ code: 'custom', message: 'Amount is too large' });
        return z.NEVER;
      }

      return kobo;
    }),
});

export type AdminEndShiftFormInput = z.input<typeof adminEndShiftSchema>;
export type AdminEndShiftValues = z.output<typeof adminEndShiftSchema>;
