import { z } from 'zod';

export const CategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(60, 'Category name must be 60 characters or fewer'),
});

export const categoryUpdateSchema = CategoryFormSchema.partial();

export type CategoryFormInput = z.input<typeof CategoryFormSchema>;
export type CategoryFormValues = z.output<typeof CategoryFormSchema>;
export type CategoryUpdateValues = z.output<typeof categoryUpdateSchema>;
