import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  REASON_META,
  formatDateTime,
  formatSigned,
  isReason,
  resolveRange,
} from '@/features/inventory/stock/lib/movement-utils';
import { STOCK_REASONS } from '@/features/inventory/stock/types';

const originalTz = process.env.TZ;

function useTimezone(tz: string) {
  process.env.TZ = tz;
}

afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe('REASON_META', () => {
  it('labels every stock reason', () => {
    expect(Object.keys(REASON_META)).toEqual([...STOCK_REASONS]);
    expect(REASON_META).toMatchObject({
      sale: { label: 'Sale' },
      restock: { label: 'Restock' },
      refund: { label: 'Refund' },
      damage: { label: 'Damage' },
      adjustment: { label: 'Adjustment' },
      initial: { label: 'Opening stock' },
    });
  });

  it('gives every reason a badge class', () => {
    for (const reason of STOCK_REASONS) {
      expect(REASON_META[reason].className).toEqual(expect.any(String));
      expect(REASON_META[reason].className.length).toBeGreaterThan(0);
    }
  });
});

describe('isReason', () => {
  it.each(STOCK_REASONS)('accepts the known reason %j', (reason) => {
    expect(isReason(reason)).toBe(true);
  });

  it.each(['', 'transfer', 'SALE', 'restock ', 'unknown'])('rejects %j', (value) => {
    expect(isReason(value)).toBe(false);
  });
});

describe('formatSigned', () => {
  it('adds a plus sign to positive numbers', () => {
    expect(formatSigned(12)).toBe('+12');
  });

  it('uses a true minus sign for negative numbers', () => {
    expect(formatSigned(-2)).toBe('−2');
    expect(formatSigned(-2).charAt(0)).toBe('\u2212');
  });

  it('renders zero without a sign', () => {
    expect(formatSigned(0)).toBe('0');
  });
});

describe('resolveRange', () => {
  it('returns an empty object when neither boundary is set', () => {
    expect(resolveRange('', '')).toEqual({});
  });

  it('ignores invalid date keys', () => {
    expect(resolveRange('not-a-date', '2026-10-07')).toEqual({
      to: expect.any(String),
    });
    expect(resolveRange('2026-10-01', '2026-13-50')).toEqual({
      from: expect.any(String),
    });
  });

  describe('in UTC', () => {
    beforeEach(() => useTimezone('UTC'));

    it('uses UTC day boundaries', () => {
      expect(resolveRange('2026-10-01', '2026-10-07')).toEqual({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-07T23:59:59.999Z',
      });
    });

    it('supports a lone from or to boundary', () => {
      expect(resolveRange('2026-10-01', '')).toEqual({
        from: '2026-10-01T00:00:00.000Z',
      });
      expect(resolveRange('', '2026-10-07')).toEqual({
        to: '2026-10-07T23:59:59.999Z',
      });
    });
  });

  describe('in Africa/Lagos', () => {
    beforeEach(() => useTimezone('Africa/Lagos'));

    it('uses local day boundaries and converts them to UTC', () => {
      expect(resolveRange('2026-10-01', '2026-10-07')).toEqual({
        from: '2026-09-30T23:00:00.000Z',
        to: '2026-10-07T22:59:59.999Z',
      });
    });
  });
});

describe('formatDateTime', () => {
  it('formats in the runtime timezone (UTC)', () => {
    useTimezone('UTC');

    expect(formatDateTime('2026-10-27T10:05:00.000Z')).toBe('Oct 27, 10:05 AM');
  });

  it('formats in the runtime timezone (Africa/Lagos)', () => {
    useTimezone('Africa/Lagos');

    expect(formatDateTime('2026-10-27T10:05:00.000Z')).toBe('Oct 27, 11:05 AM');
  });
});
