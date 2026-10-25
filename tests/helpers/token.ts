function encodeSegment(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createToken(
  expiresInSeconds: number,
  claims: Record<string, unknown> = {},
): string {
  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeSegment({
    sub: 'staff-1',
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    ...claims,
  });

  return `${header}.${payload}.test-signature`;
}
