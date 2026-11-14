import { describe, expect, it } from 'vitest';

import {
  koboToNairaInput,
  formatNairaCompact,
  parseNairaPreview,
  parseNairaToKobo,
} from '@/lib/money';

describe('parseNairaToKobo', () => {
  it.each([
    ['', null],
    ['   ', null],
    [undefined, null],
    ['0', 0],
    ['100', 10000],
    ['100.5', 10050],
    ['100.50', 10050],
    ['0.01', 1],
    ['0.10', 10],
    ['000.99', 99],
    [' 100 ', 10000],
    ['12.', 1200],
    ['999999', 99999900],
  ])('parses %j to %j kobo', (input, expected) => {
    expect(parseNairaToKobo(input)).toBe(expected);
  });

  it.each(['abc', '-1', '.5', '1.234', '1,000', '1e3', '₦100', '100 000', '.'])(
    'rejects invalid input %j',
    (input) => {
      expect(parseNairaToKobo(input)).toBeNull();
    },
  );

  it('exposes the same function as parseNairaPreview', () => {
    expect(parseNairaPreview).toBe(parseNairaToKobo);
  });
});

describe('formatNairaCompact', () => {
  it.each([
    [null, '₦0'],
    [undefined, '₦0'],
    [Number.NaN, '₦0'],
    [Number.POSITIVE_INFINITY, '₦0'],
    [0, '₦0'],
    [99, '₦0.99'],
    [10_000, '₦100'],
    [100_000, '₦1k'],
    [150_000, '₦1.5k'],
    [123_456, '₦1.2k'],
    [100_000_000, '₦1M'],
    [150_000_000, '₦1.5M'],
  ])('formats %j kobo as %j', (kobo, expected) => {
    expect(formatNairaCompact(kobo)).toBe(expected);
  });

  it('formats negative amounts without throwing', () => {
    expect(formatNairaCompact(-150_000)).toBe('-₦1.5k');
  });

  it('handles very large amounts without throwing', () => {
    expect(() => formatNairaCompact(Number.MAX_SAFE_INTEGER)).not.toThrow();
    expect(formatNairaCompact(Number.MAX_SAFE_INTEGER)).toContain('₦');
  });
});

describe('koboToNairaInput', () => {
  it.each([
    [null, ''],
    [undefined, ''],
    [0, '0'],
    [5, '0.05'],
    [100, '1'],
    [105, '1.05'],
    [10050, '100.50'],
    [150050, '1500.50'],
    [999999, '9999.99'],
  ])('formats %j kobo as %j', (kobo, expected) => {
    expect(koboToNairaInput(kobo)).toBe(expected);
  });

  it('round-trips values through the parser', () => {
    for (const kobo of [0, 1, 99, 100, 101, 150050, 99999900]) {
      expect(parseNairaToKobo(koboToNairaInput(kobo))).toBe(kobo);
    }
  });
});
