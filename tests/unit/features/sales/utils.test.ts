import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api-error';
import {
  clampQuantity,
  getSaleErrorInfo,
  isLowStock,
  isOutOfStock,
  paymentMethodLabel,
  productImageUrl,
  shouldRefreshItems,
} from '@/features/sales/utils';

describe('paymentMethodLabel', () => {
  it.each([
    ['cash', 'Cash'],
    ['card', 'Card'],
    ['bank_transfer', 'Bank transfer'],
  ] as const)('labels %s as %s', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label);
  });

  it('renders a dash for a missing method', () => {
    expect(paymentMethodLabel(null)).toBe('—');
    expect(paymentMethodLabel(undefined)).toBe('—');
  });
});

describe('productImageUrl', () => {
  it('returns null without variants', () => {
    expect(productImageUrl()).toBeNull();
    expect(productImageUrl(null)).toBeNull();
    expect(productImageUrl({})).toBeNull();
  });

  it('prefers the smallest variant then falls back in order', () => {
    expect(
      productImageUrl({
        thumb: 'thumb.jpg',
        medium: 'medium.jpg',
        full: 'full.jpg',
        original: 'original.jpg',
      }),
    ).toBe('thumb.jpg');

    expect(productImageUrl({ medium: 'medium.jpg', full: 'full.jpg' })).toBe('medium.jpg');
    expect(productImageUrl({ full: 'full.jpg', original: 'original.jpg' })).toBe('full.jpg');
    expect(productImageUrl({ original: 'original.jpg' })).toBe('original.jpg');
  });
});

describe('stock helpers', () => {
  it('only flags low stock when a threshold is set', () => {
    expect(isLowStock({ reorder_threshold: 5, stock_quantity: 5 })).toBe(true);
    expect(isLowStock({ reorder_threshold: 5, stock_quantity: 6 })).toBe(false);
    expect(isLowStock({ reorder_threshold: 0, stock_quantity: 0 })).toBe(false);
  });

  it('flags zero and negative stock as out of stock', () => {
    expect(isOutOfStock({ stock_quantity: 0 })).toBe(true);
    expect(isOutOfStock({ stock_quantity: -1 })).toBe(true);
    expect(isOutOfStock({ stock_quantity: 1 })).toBe(false);
  });
});

describe('clampQuantity', () => {
  it.each([
    [5, 10, 5],
    [0, 10, 1],
    [-4, 10, 1],
    [99, 10, 10],
    [2.7, 10, 2],
    [Number.NaN, 10, 1],
    [5, 0, 1],
  ])('clamps %j with a max of %j to %j', (quantity, max, expected) => {
    expect(clampQuantity(quantity, max)).toBe(expected);
  });
});

describe('getSaleErrorInfo', () => {
  it.each([
    ['no_open_shift', 'Clock in before making a sale'],
    ['total_mismatch', 'Prices have changed. Review the new total before completing the sale.'],
    ['insufficient_stock', 'Some items no longer have enough stock. Review the flagged lines.'],
    ['item_inactive', 'Some items are no longer available. Remove the flagged lines.'],
    ['payment_account_required', 'Choose an account for this payment method'],
    ['payment_account_not_found', 'That account is no longer available. Choose another one.'],
    ['payment_account_not_allowed', 'Cash sales cannot use a POS account.'],
    ['invalid_payment_method', 'Choose a valid payment method'],
    [
      'sale_total_too_large',
      'This sale is too large to record. Reduce the quantities and try again.',
    ],
    [
      'idempotency_key_reused',
      'This sale was already submitted. Close checkout and start a new sale.',
    ],
  ])('maps %s to its user-facing message', (code, message) => {
    const info = getSaleErrorInfo(new ApiError('server text', { code }));

    expect(info.code).toBe(code);
    expect(info.message).toBe(message);
  });

  it('flags payment account errors on the POS account field', () => {
    expect(getSaleErrorInfo(new ApiError('', { code: 'payment_account_required' })).field).toBe(
      'pos_account_id',
    );
    expect(getSaleErrorInfo(new ApiError('', { code: 'payment_account_not_found' })).field).toBe(
      'pos_account_id',
    );
    expect(getSaleErrorInfo(new ApiError('', { code: 'no_open_shift' })).field).toBeUndefined();
  });

  it('reads raw axios error bodies and joins validation messages', () => {
    const info = getSaleErrorInfo({
      response: {
        data: {
          code: 'validation_failed',
          message: ['items should not be empty', 'items must be an array'],
        },
      },
    });

    expect(info.code).toBe('validation_failed');
    expect(info.message).toBe('items should not be empty, items must be an array');
  });

  it('falls back to a plain Error message for unknown failures', () => {
    const info = getSaleErrorInfo(new Error('Network exploded'));

    expect(info.code).toBeUndefined();
    expect(info.message).toBe('Network exploded');
  });

  it('uses a generic message when the error carries nothing useful', () => {
    expect(getSaleErrorInfo({}).message).toBe('Could not complete the sale');
    expect(getSaleErrorInfo(null).message).toBe('Could not complete the sale');
  });
});

describe('shouldRefreshItems', () => {
  it.each(['total_mismatch', 'insufficient_stock', 'item_inactive'])(
    'refreshes items for %s',
    (code) => {
      expect(shouldRefreshItems(code)).toBe(true);
    },
  );

  it.each([undefined, 'no_open_shift', 'payment_account_required', 'unknown'])(
    'does not refresh items for %s',
    (code) => {
      expect(shouldRefreshItems(code)).toBe(false);
    },
  );
});
