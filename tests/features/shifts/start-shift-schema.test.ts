import { describe, expect, it } from 'vitest';

import { startShiftSchema } from '@/features/shifts/schemas/start-shift.schema';

function parse(opening_float: string, opening_notes?: string) {
  return startShiftSchema.safeParse({ opening_float, opening_notes });
}

describe('startShiftSchema', () => {
  it.each([
    ['1500', 150_000],
    ['1500.50', 150_050],
    ['1500.5', 150_050],
    ['0.01', 1],
    ['0', 0],
    ['', 0],
  ])('converts %s naira to kobo', (input, expected) => {
    const result = parse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.opening_float).toBe(expected);
    }
  });

  it.each(['-1', '-1500.50'])('rejects negative amount %s', (input) => {
    const result = parse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/cannot be negative/i);
    }
  });

  it.each(['10.123', '10.999'])('rejects amounts with more than two decimals: %s', (input) => {
    const result = parse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/up to 2 decimal places/i);
    }
  });

  it.each(['abc', '1,500', '1.2.3', '₦1500'])('rejects non-numeric amount %s', (input) => {
    expect(parse(input).success).toBe(false);
  });

  it('omits empty notes and accepts notes up to 500 characters', () => {
    const empty = parse('0', '');

    expect(empty.success).toBe(true);
    if (empty.success) {
      expect(empty.data.opening_notes).toBeUndefined();
    }

    const atLimit = parse('0', 'a'.repeat(500));
    expect(atLimit.success).toBe(true);
  });

  it('rejects notes longer than 500 characters', () => {
    const result = parse('0', 'a'.repeat(501));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/500 characters or fewer/i);
    }
  });
});
