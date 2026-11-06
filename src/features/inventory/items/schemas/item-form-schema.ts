import z from 'zod';

export const itemFormSchema = z.object({
  name: z.string().min(1, 'Item name is required').trim().max(160),
  barcode: z.string().trim().max(64).optional().or(z.literal('')),
  category_id: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Unit is required').trim().max(40),
  current_price: z
    .string()
    .min(1, 'Selling price is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
      message: 'Must be a non-negative number',
    }),
  cost_price: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Must be a non-negative number',
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
  // image is handled outside the schema (File | null)
});

export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;
