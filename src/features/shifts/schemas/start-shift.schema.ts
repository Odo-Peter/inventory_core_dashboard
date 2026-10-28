import { z } from 'zod';

const NAIRA_PATTERN = /^\d+(\.\d{1,2})?$/;

function nairaToKobo(value: string): number {
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export const startShiftSchema = z
  .object({
    opening_float: z
      .string()
      .trim()
      .superRefine((value, context) => {
        if (value === '') {
          return;
        }

        if (value.startsWith('-')) {
          context.addIssue({
            code: 'custom',
            message: 'Starting cash cannot be negative',
          });
          return;
        }

        if (!NAIRA_PATTERN.test(value)) {
          context.addIssue({
            code: 'custom',
            message: 'Enter a valid amount with up to 2 decimal places',
          });
        }
      })
      .transform((value) => (value === '' ? 0 : nairaToKobo(value))),
    opening_notes: z
      .string()
      .trim()
      .max(500, 'Opening notes must be 500 characters or fewer')
      .optional()
      .transform((value) => value || undefined),
  })
  .transform(({ opening_float, opening_notes }) =>
    opening_notes ? { opening_float, opening_notes } : { opening_float },
  );

export const endShiftSchema = z
  .object({
    closing_cash_counted: z
      .string()
      .trim()
      .min(1, 'Enter the closing cash counted')
      .superRefine((value, context) => {
        if (value.startsWith('-')) {
          context.addIssue({
            code: 'custom',
            message: 'Closing cash cannot be negative',
          });
          return;
        }

        if (!NAIRA_PATTERN.test(value)) {
          context.addIssue({
            code: 'custom',
            message: 'Enter a valid amount with up to 2 decimal places',
          });
        }
      })
      .transform((value) => nairaToKobo(value)),
    closing_notes: z
      .string()
      .trim()
      .max(500, 'Closing notes must be 500 characters or fewer')
      .optional()
      .transform((value) => value || undefined),
  })
  .transform(({ closing_cash_counted, closing_notes }) =>
    closing_notes ? { closing_cash_counted, closing_notes } : { closing_cash_counted },
  );

export type StartShiftFormInput = z.input<typeof startShiftSchema>;
export type StartShiftValues = z.output<typeof startShiftSchema>;
export type EndShiftFormInput = z.input<typeof endShiftSchema>;
export type EndShiftValues = z.output<typeof endShiftSchema>;
