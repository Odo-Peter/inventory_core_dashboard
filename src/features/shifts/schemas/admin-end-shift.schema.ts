import { z } from 'zod';

const NAIRA_PATTERN = /^\d+(\.\d{1,2})?$/;

function nairaToKobo(value: string): number {
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function parseNairaPreview(value: string | undefined): number | null {
  const trimmed = (value ?? '').trim().replace(/\.$/, ''); // allow "12." mid-typing
  if (!trimmed || !NAIRA_PATTERN.test(trimmed)) return null;
  return nairaToKobo(trimmed);
}

export const adminEndShiftSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Reason must be 500 characters or fewer')
    .optional()
    .transform((value) => value || undefined),
  closing_cash_counted: z
    .string()
    .trim()
    .min(1, 'Enter the closing cash amount')
    .superRefine((value, ctx) => {
      if (value.startsWith('-')) {
        ctx.addIssue({ code: 'custom', message: 'Cannot be negative' });
        return;
      }
      if (!NAIRA_PATTERN.test(value)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid amount with up to 2 decimal places',
        });
      }
    })
    .transform((value) => nairaToKobo(value)),
});

export type AdminEndShiftFormInput = z.input<typeof adminEndShiftSchema>;
export type AdminEndShiftValues = z.output<typeof adminEndShiftSchema>;
