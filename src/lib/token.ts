import { jwtDecode } from 'jwt-decode';

export const TOKEN_STORAGE_KEY = 'stocktake_access_token';

type TokenListener = () => void;

const tokenListeners = new Set<TokenListener>();

function notifyTokenListeners() {
  for (const listener of tokenListeners) listener();
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Write the access token and notify listeners. Kept in one place so the auth
 * provider can react to login/logout without polling sessionStorage.
 */
export function setStoredToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  notifyTokenListeners();
}

export function clearStoredToken(): void {
  setStoredToken(null);
}

/** Subscribe to token changes made through `setStoredToken`/`clearStoredToken`. */
export function subscribeToken(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
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
