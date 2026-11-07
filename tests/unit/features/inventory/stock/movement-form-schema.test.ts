import { describe, expect, it } from 'vitest';

import {
  movementFormSchema,
  type MovementFormInput,
} from '@/features/inventory/stock/schemas/movement-form-schema';

const valid: MovementFormInput = {
  item_id: 'item-1',
  action: 'receive',
  direction: 'increase',
  quantity: '5',
  note: '',
  supplier_name: '',
  delivery_reference: '',
};

function firstError(input: unknown) {
  const result = movementFormSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

function errorPaths(input: unknown) {
  const result = movementFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('movementFormSchema', () => {
  it('accepts a valid receive movement and trims optional text', () => {
    const result = movementFormSchema.safeParse({
      ...valid,
      note: '  Delivered in full  ',
      supplier_name: '  Acme Stores ',
      delivery_reference: '  INV-20418  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe('Delivered in full');
      expect(result.data.supplier_name).toBe('Acme Stores');
      expect(result.data.delivery_reference).toBe('INV-20418');
    }
  });

  it('requires an item', () => {
    expect(firstError({ ...valid, item_id: '' })).toBe('Choose an item');
  });

  it.each(['receive', 'adjust', 'damage', 'initial'] as const)(
    'accepts the %s action',
    (action) => {
      expect(movementFormSchema.safeParse({ ...valid, action, note: 'Reason' }).success).toBe(true);
    },
  );

  it('rejects an unknown action', () => {
    expect(firstError({ ...valid, action: 'transfer' })).toBeTruthy();
  });

  it('requires increase or decrease as the direction', () => {
    expect(firstError({ ...valid, direction: 'sideways' })).toBeTruthy();
  });

  it.each(['', '0', '-1', '1.5', 'abc', '   '])('rejects the quantity %j', (quantity) => {
    expect(firstError({ ...valid, quantity })).toBeTruthy();
  });

  it.each(['1', '5', '100', ' 7 '])('accepts the positive whole quantity %j', (quantity) => {
    expect(movementFormSchema.safeParse({ ...valid, quantity }).success).toBe(true);
  });

  it('requires a note when adjusting stock', () => {
    expect(firstError({ ...valid, action: 'adjust', note: '' })).toBe('Add a note explaining why');
    expect(firstError({ ...valid, action: 'adjust', note: '   ' })).toBe(
      'Add a note explaining why',
    );
    expect(
      movementFormSchema.safeParse({ ...valid, action: 'adjust', note: 'Recount' }).success,
    ).toBe(true);
  });

  it('requires a note when recording damage', () => {
    expect(firstError({ ...valid, action: 'damage', note: '' })).toBe('Add a note explaining why');
    expect(errorPaths({ ...valid, action: 'damage' })).toEqual(['note']);
  });

  it('keeps the note optional for receive and opening stock', () => {
    expect(movementFormSchema.safeParse({ ...valid, action: 'receive', note: '' }).success).toBe(
      true,
    );
    expect(movementFormSchema.safeParse({ ...valid, action: 'initial', note: '' }).success).toBe(
      true,
    );
  });

  it('limits the note to 500 characters', () => {
    expect(movementFormSchema.safeParse({ ...valid, note: 'a'.repeat(500) }).success).toBe(true);
    expect(firstError({ ...valid, note: 'a'.repeat(501) })).toBeTruthy();
  });

  it('limits supplier and delivery reference fields to 120 characters', () => {
    expect(firstError({ ...valid, supplier_name: 'a'.repeat(121) })).toBeTruthy();
    expect(firstError({ ...valid, delivery_reference: 'a'.repeat(121) })).toBeTruthy();
    expect(
      movementFormSchema.safeParse({
        ...valid,
        supplier_name: 'a'.repeat(120),
        delivery_reference: 'a'.repeat(120),
      }).success,
    ).toBe(true);
  });
});
