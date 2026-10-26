const PALETTE = [
  { bg: 'fde68a', fg: '78350f' }, // amber
  { bg: 'fecaca', fg: '7f1d1d' }, // red
  { bg: 'fbcfe8', fg: '831843' }, // pink
  { bg: 'e9d5ff', fg: '581c87' }, // purple
  { bg: 'c7d2fe', fg: '312e81' }, // indigo
  { bg: 'bae6fd', fg: '0c4a6e' }, // sky
  { bg: 'a7f3d0', fg: '064e3b' }, // emerald
  { bg: 'd9f99d', fg: '365314' }, // lime
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
