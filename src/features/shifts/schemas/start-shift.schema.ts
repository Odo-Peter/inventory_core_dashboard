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
        if (value === '') return;

        if (value.startsWith('-')) {
          context.addIssue({
            code: 'custom',
            message: 'Opening float cannot be negative',
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

export type StartShiftFormInput = z.input<typeof startShiftSchema>;
export type StartShiftValues = z.output<typeof startShiftSchema>;
