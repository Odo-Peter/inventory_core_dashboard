import { describe, expect, it } from 'vitest';
import { isTokenValid } from '@/lib/token';
import { createToken } from '../../helpers/token';

describe('isTokenValid', () => {
  it('returns false for a missing token', () => {
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid('')).toBe(false);
  });

  it('returns false for a malformed token', () => {
    expect(isTokenValid('not-a-jwt')).toBe(false);
    expect(isTokenValid('a.b.c')).toBe(false);
  });

  it('returns false for a token without an exp claim', () => {
    const token = createToken(3600, { exp: undefined });

    expect(isTokenValid(token)).toBe(false);
  });

  it('returns false for an expired token', () => {
    expect(isTokenValid(createToken(-60))).toBe(false);
  });

  it('returns true for a token that has not expired', () => {
    expect(isTokenValid(createToken(3600))).toBe(true);
  });
});
