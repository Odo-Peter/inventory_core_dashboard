import z from 'zod';

export const posAccountFormSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .trim()
    .max(100, 'Label must be 100 characters or less'),

  type: z.string().min(1, 'Type is required').trim(),

  details: z.record(z.string(), z.unknown()).optional().or(z.literal('')),
});

export type PosAccountFormInput = z.input<typeof posAccountFormSchema>;
export type PosAccountFormValues = z.output<typeof posAccountFormSchema>;
