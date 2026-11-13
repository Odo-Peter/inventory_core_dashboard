import { z } from 'zod';

/**
 * The API docs do not publish `UpdateStoreDto`, so these are the limits the
 * form enforces until the OpenAPI schema exposes the backend values.
 */
export const STORE_FIELD_LIMITS = {
  name: 120,
  address: 255,
  phone: 20,
  receiptFooter: 500,
} as const;

export const storeSettingsFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Store name is required')
    .max(
      STORE_FIELD_LIMITS.name,
      `Store name must be ${STORE_FIELD_LIMITS.name} characters or fewer`,
    ),
  address: z
    .string()
    .trim()
    .max(
      STORE_FIELD_LIMITS.address,
      `Address must be ${STORE_FIELD_LIMITS.address} characters or fewer`,
    ),
  phone: z
    .string()
    .trim()
    .max(STORE_FIELD_LIMITS.phone, `Phone must be ${STORE_FIELD_LIMITS.phone} characters or fewer`),
  receipt_footer: z
    .string()
    .trim()
    .max(
      STORE_FIELD_LIMITS.receiptFooter,
      `Receipt footer must be ${STORE_FIELD_LIMITS.receiptFooter} characters or fewer`,
    ),
});

export type StoreSettingsFormInput = z.input<typeof storeSettingsFormSchema>;
export type StoreSettingsValues = z.output<typeof storeSettingsFormSchema>;
