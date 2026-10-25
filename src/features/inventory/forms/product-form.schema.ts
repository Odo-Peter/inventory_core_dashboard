import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stock: z.coerce.number().int().nonnegative('Stock must be 0 or more'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
