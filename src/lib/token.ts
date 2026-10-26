import { jwtDecode } from 'jwt-decode';

export const TOKEN_STORAGE_KEY = 'stocktake_access_token';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return false;

    return exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
