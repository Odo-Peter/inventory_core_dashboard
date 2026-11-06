import z from 'zod';

export const movementFormSchema = z
  .object({
    item_id: z.string().min(1, 'Choose an item'),
    action: z.enum(['receive', 'adjust', 'damage', 'initial']),
    // Only used by "adjust". The user types a positive quantity and picks a direction.
    direction: z.enum(['increase', 'decrease']),
    quantity: z
      .string()
      .min(1, 'Quantity is required')
      .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
        message: 'Enter a whole number above zero',
      }),
    // Max lengths below are guesses. Match them to your DTOs.
    note: z.string().trim().max(500).optional().or(z.literal('')),
    supplier_name: z.string().trim().max(120).optional().or(z.literal('')),
    delivery_reference: z.string().trim().max(120).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    const noteRequired = values.action === 'adjust' || values.action === 'damage';

    if (noteRequired && !values.note?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Add a note explaining why',
      });
    }
  });

export type MovementFormInput = z.input<typeof movementFormSchema>;
export type MovementFormValues = z.output<typeof movementFormSchema>;
