import { describe, expect, it } from 'vitest';

import {
  STORE_FIELD_LIMITS,
  storeSettingsFormSchema,
} from '@/features/settings/schemas/store-settings.schema';

const validStore = {
  name: 'Main Store',
  address: '1 Main Street',
  phone: '+2348030000000',
  receipt_footer: 'Thank you for your custom',
};

function firstError(input: unknown) {
  const result = storeSettingsFormSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

describe('storeSettingsFormSchema', () => {
  it('accepts a valid store and trims every field', () => {
    const result = storeSettingsFormSchema.safeParse({
      name: '  Main Store  ',
      address: '  1 Main Street ',
      phone: ' +2348030000000 ',
      receipt_footer: '  Thank you  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Main Store',
        address: '1 Main Street',
        phone: '+2348030000000',
        receipt_footer: 'Thank you',
      });
    }
  });

  it('requires a non-blank name', () => {
    expect(firstError({ ...validStore, name: '' })).toBe('Store name is required');
    expect(firstError({ ...validStore, name: '   ' })).toBe('Store name is required');
  });

  it('allows every optional field to be empty', () => {
    expect(
      storeSettingsFormSchema.safeParse({
        name: 'Main Store',
        address: '',
        phone: '',
        receipt_footer: '',
      }).success,
    ).toBe(true);
  });

  it('enforces the configured field limits', () => {
    expect(firstError({ ...validStore, name: 'a'.repeat(STORE_FIELD_LIMITS.name + 1) })).toBe(
      `Store name must be ${STORE_FIELD_LIMITS.name} characters or fewer`,
    );
    expect(firstError({ ...validStore, address: 'a'.repeat(STORE_FIELD_LIMITS.address + 1) })).toBe(
      `Address must be ${STORE_FIELD_LIMITS.address} characters or fewer`,
    );
    expect(firstError({ ...validStore, phone: '1'.repeat(STORE_FIELD_LIMITS.phone + 1) })).toBe(
      `Phone must be ${STORE_FIELD_LIMITS.phone} characters or fewer`,
    );
    expect(
      firstError({
        ...validStore,
        receipt_footer: 'a'.repeat(STORE_FIELD_LIMITS.receiptFooter + 1),
      }),
    ).toBe(`Receipt footer must be ${STORE_FIELD_LIMITS.receiptFooter} characters or fewer`);
  });
});
