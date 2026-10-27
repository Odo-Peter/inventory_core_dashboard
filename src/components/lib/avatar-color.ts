const PALETTE = [
  { bg: '6F49F8', fg: 'fff' },
  { bg: 'F87E49', fg: 'fff' },
  { bg: '1965F3', fg: 'fff' },
  { bg: 'C330F4', fg: 'fff' },
] as const;

const STORAGE_KEY = 'avatar-color-index';

export function getSessionAvatarColor() {
  try {
    const saved = Number(sessionStorage.getItem(STORAGE_KEY));
    if (
      Number.isInteger(saved) &&
      saved >= 0 &&
      saved < PALETTE.length &&
      sessionStorage.getItem(STORAGE_KEY) !== null
    ) {
      return PALETTE[saved];
    }

    const index = Math.floor(Math.random() * PALETTE.length);
    sessionStorage.setItem(STORAGE_KEY, String(index));
    return PALETTE[index];
  } catch {
    // Storage unavailable (private mode, blocked): fall back to a fixed color
    return PALETTE[0];
  }
}

export function clearSessionAvatarColor() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
