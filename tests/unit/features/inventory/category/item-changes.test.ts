import { describe, expect, it } from 'vitest';

import { getItemChanges } from '@/features/inventory/category/lib/item-changes';
import type { ItemFormInput } from '@/features/inventory/items/schemas/item-form-schema';
import { makeItem } from '../../../../helpers/items';

const saved = makeItem();

const unchanged: ItemFormInput = {
  name: 'Coca-Cola 50cl',
  barcode: '1234567890',
  category_id: 'category-1',
  unit: 'bottle',
  current_price: '1500',
  // 1000 kobo is ₦10.00
  cost_price: '10',
  reorder_threshold: '5',
  active: 'true',
};

function changes(overrides: Partial<ItemFormInput> = {}) {
  return getItemChanges({ ...unchanged, ...overrides }, saved);
}

describe('getItemChanges', () => {
  it('returns no changes when every editable field matches the saved item', () => {
    expect(changes()).toEqual({});
  });

  it('normalises whitespace before comparing names', () => {
    expect(changes({ name: '  Coca-Cola   50cl  ' })).toEqual({});
    expect(changes({ name: '  Coca-Cola Zero  ' })).toEqual({ name: 'Coca-Cola Zero' });
  });

  it('ignores a blank name so an invalid form never clears it', () => {
    expect(changes({ name: '' })).toEqual({});
    expect(changes({ name: '   ' })).toEqual({});
  });

  it('converts a blank barcode to null', () => {
    expect(changes({ barcode: '' })).toEqual({ barcode: null });
    expect(changes({ barcode: '   ' })).toEqual({ barcode: null });
    expect(changes({ barcode: ' 999 ' })).toEqual({ barcode: '999' });
    expect(changes({ barcode: '1234567890' })).toEqual({});
  });

  it('does not send a null barcode when both sides are already blank', () => {
    const noBarcode = makeItem({ barcode: null });

    expect(getItemChanges({ ...unchanged, barcode: '' }, noBarcode)).toEqual({});
  });

  it('treats "none" and blank categories as uncategorized', () => {
    expect(changes({ category_id: 'none' })).toEqual({ category_id: null });
    expect(changes({ category_id: '' })).toEqual({ category_id: null });
    expect(changes({ category_id: 'category-2' })).toEqual({ category_id: 'category-2' });
    expect(changes({ category_id: 'category-1' })).toEqual({});
  });

  it('detects unit changes but ignores a blank unit', () => {
    expect(changes({ unit: 'pack' })).toEqual({ unit: 'pack' });
    expect(changes({ unit: '' })).toEqual({});
  });

  it('compares cost price in kobo', () => {
    expect(changes({ cost_price: '10' })).toEqual({});
    expect(changes({ cost_price: '10.00' })).toEqual({});
    expect(changes({ cost_price: '12.34' })).toEqual({ cost_price: 1234 });
  });

  it('clears the cost price when the input is blank', () => {
    expect(changes({ cost_price: '' })).toEqual({ cost_price: null });
    const noCost = makeItem({ cost_price: null });
    expect(getItemChanges({ ...unchanged, cost_price: '' }, noCost)).toEqual({});
  });

  it('ignores an invalid cost price string (the schema rejects it first)', () => {
    expect(changes({ cost_price: 'abc' })).toEqual({});
  });

  it('currently treats a raw kobo default as naira (regression)', () => {
    // Edit mode pre-fills String(item.cost_price) instead of koboToNairaInput,
    // so an untouched 1000-kobo cost is parsed as ₦1,000.00.
    expect(changes({ cost_price: '1000' })).toEqual({ cost_price: 100000 });
  });

  it('converts a blank reorder threshold to zero', () => {
    expect(changes({ reorder_threshold: '' })).toEqual({ reorder_threshold: 0 });
    expect(changes({ reorder_threshold: '   ' })).toEqual({ reorder_threshold: 0 });
    const noReorder = makeItem({ reorder_threshold: 0 });
    expect(getItemChanges({ ...unchanged, reorder_threshold: '' }, noReorder)).toEqual({});
  });

  it('sends whole-number reorder changes and rounds decimals', () => {
    expect(changes({ reorder_threshold: '8' })).toEqual({ reorder_threshold: 8 });
    expect(changes({ reorder_threshold: '1.4' })).toEqual({ reorder_threshold: 1 });
    expect(changes({ reorder_threshold: '1.6' })).toEqual({ reorder_threshold: 2 });
  });

  it('ignores a non-numeric reorder threshold', () => {
    expect(changes({ reorder_threshold: 'abc' })).toEqual({});
  });

  it('only returns fields that actually changed', () => {
    expect(
      changes({
        name: 'Coca-Cola Zero',
        barcode: '',
        category_id: 'none',
        unit: 'pack',
        cost_price: '12',
        reorder_threshold: '9',
      }),
    ).toEqual({
      name: 'Coca-Cola Zero',
      barcode: null,
      category_id: null,
      unit: 'pack',
      cost_price: 1200,
      reorder_threshold: 9,
    });
  });

  it('never includes price, active, or image fields', () => {
    const result = changes({
      current_price: '9999',
      active: 'false',
    });

    expect(result).toEqual({});
    expect(result).not.toHaveProperty('current_price');
    expect(result).not.toHaveProperty('active');
    expect(result).not.toHaveProperty('image');
  });
});
