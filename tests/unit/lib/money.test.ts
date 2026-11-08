import { describe, expect, it } from 'vitest';

import { koboToNairaInput, parseNairaPreview, parseNairaToKobo } from '@/lib/money';

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
