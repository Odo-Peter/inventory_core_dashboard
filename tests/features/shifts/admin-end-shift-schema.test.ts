import { describe, expect, it } from 'vitest';

import { adminEndShiftSchema } from '@/features/shifts/schemas/admin-end-shift.schema';

function firstError(input: unknown) {
  const result = adminEndShiftSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

const valid = {
  reason: 'Closing the till',
  closing_cash_counted: '1000',
};

describe('adminEndShiftSchema', () => {
  it('trims the reason and converts the counted cash to kobo', () => {
    const result = adminEndShiftSchema.safeParse({
      reason: '  Closing the till  ',
      closing_cash_counted: '1000',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        reason: 'Closing the till',
        closing_cash_counted: 100000,
      });
    }
  });

  it.each([
    ['0', 0],
    ['100.5', 10050],
    ['100.50', 10050],
    ['0.01', 1],
    [' 250 ', 25000],
    ['21474836.47', 2147483647],
  ])('accepts the amount %j and stores %j kobo', (closing_cash_counted, expected) => {
    const result = adminEndShiftSchema.safeParse({ ...valid, closing_cash_counted });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.closing_cash_counted).toBe(expected);
    }
  });

  it('requires a closing reason', () => {
    expect(firstError({ ...valid, reason: '' })).toBe('Enter a closing reason');
    expect(firstError({ ...valid, reason: '   ' })).toBe('Enter a closing reason');
  });

  it('limits the closing reason to 500 characters', () => {
    expect(firstError({ ...valid, reason: 'a'.repeat(501) })).toBe(
      'Reason must be 500 characters or fewer',
    );
    expect(adminEndShiftSchema.safeParse({ ...valid, reason: 'a'.repeat(500) }).success).toBe(true);
  });

  it('requires the closing cash amount', () => {
    expect(firstError({ ...valid, closing_cash_counted: '' })).toBe(
      'Enter the closing cash amount',
    );
  });

  it('rejects negative amounts', () => {
    expect(firstError({ ...valid, closing_cash_counted: '-1' })).toBe('Cannot be negative');
    expect(firstError({ ...valid, closing_cash_counted: '-0.01' })).toBe('Cannot be negative');
  });

  it.each(['abc', '1.234', '1,000', '₦100', '.'])(
    'rejects the malformed amount %j',
    (closing_cash_counted) => {
      expect(firstError({ ...valid, closing_cash_counted })).toBe(
        'Enter a valid amount with up to 2 decimal places',
      );
    },
  );

  it('rejects amounts above the database integer limit', () => {
    expect(firstError({ ...valid, closing_cash_counted: '21474836.48' })).toBe(
      'Amount is too large',
    );
  });
});
