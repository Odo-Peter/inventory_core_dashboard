import { parseNairaToKobo } from '@/lib/money';
import z from 'zod';

export const itemFormSchema = z.object({
  name: z.string().min(1, 'Item name is required').trim().max(160),
  barcode: z.string().trim().max(64).optional().or(z.literal('')),
  category_id: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Unit is required').trim().max(40),
  current_price: z
    .string()
    .min(1, 'Selling price is required')
    .refine((v) => parseNairaToKobo(v) !== null, {
      message: 'Enter an amount like 1500 or 1500.50',
    }),
  cost_price: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || parseNairaToKobo(v) !== null, {
      message: 'Enter an amount like 1500 or 1500.50',
    }),
  reorder_threshold: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) =>
        v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v))),
      {
        message: 'Must be a non-negative integer',
      },
    ),
  active: z.enum(['true', 'false']),
});

export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;

export const changePriceSchema = z.object({
  new_price: z
    .string()
    .min(1, 'New price is required')
    .refine((v) => parseNairaToKobo(v) !== null, {
      message: 'Enter an amount like 1500 or 1500.50',
    }),
});

export type ChangePriceInput = z.input<typeof changePriceSchema>;
