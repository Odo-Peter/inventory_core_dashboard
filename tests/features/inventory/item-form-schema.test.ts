import { describe, expect, it } from 'vitest';

import { itemFormSchema } from '@/features/inventory/items/schemas/item-form-schema';

const validItem = {
  name: 'Coca-Cola 50cl',
  barcode: '',
  category_id: '',
  unit: 'bottle',
  current_price: '1500',
  cost_price: '',
  reorder_threshold: '0',
  active: 'true' as const,
};

function firstError(input: unknown) {
  const result = itemFormSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

describe('itemFormSchema', () => {
  it('accepts a minimal valid item and trims text fields', () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      name: '  Coca-Cola 50cl  ',
      barcode: ' 12345 ',
      unit: ' bottle ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Coca-Cola 50cl');
      expect(result.data.barcode).toBe('12345');
      expect(result.data.unit).toBe('bottle');
    }
  });

  it('requires a name and limits it to 160 characters', () => {
    expect(firstError({ ...validItem, name: '' })).toBe('Item name is required');
    expect(firstError({ ...validItem, name: 'a'.repeat(161) })).toBeTruthy();
  });

  it('limits the barcode to 64 characters', () => {
    expect(firstError({ ...validItem, barcode: '1'.repeat(65) })).toBeTruthy();
  });

  it('requires a non-negative selling price', () => {
    expect(firstError({ ...validItem, current_price: '' })).toBe('Selling price is required');
    expect(firstError({ ...validItem, current_price: '-1' })).toBe('Must be a non-negative number');
    expect(firstError({ ...validItem, current_price: 'abc' })).toBe(
      'Must be a non-negative number',
    );
  });

  it('allows a blank cost price but rejects negative or non-numeric values', () => {
    expect(itemFormSchema.safeParse({ ...validItem, cost_price: '' }).success).toBe(true);
    expect(firstError({ ...validItem, cost_price: '-20' })).toBe('Must be a non-negative number');
    expect(firstError({ ...validItem, cost_price: 'ten' })).toBe('Must be a non-negative number');
  });

  it('allows a blank reorder threshold but requires a non-negative integer', () => {
    expect(itemFormSchema.safeParse({ ...validItem, reorder_threshold: '' }).success).toBe(true);
    expect(firstError({ ...validItem, reorder_threshold: '-1' })).toBe(
      'Must be a non-negative integer',
    );
    expect(firstError({ ...validItem, reorder_threshold: '1.5' })).toBe(
      'Must be a non-negative integer',
    );
  });

  it('requires a valid active status', () => {
    expect(itemFormSchema.safeParse({ ...validItem, active: 'true' }).success).toBe(true);
    expect(itemFormSchema.safeParse({ ...validItem, active: 'false' }).success).toBe(true);
    expect(itemFormSchema.safeParse({ ...validItem, active: 'yes' }).success).toBe(false);
  });
});
