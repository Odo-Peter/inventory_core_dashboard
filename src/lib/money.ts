const NAIRA_PATTERN = /^\d+(\.\d{1,2})?$/;

/** "100.5" -> 10050. Returns null for empty or invalid input. */
export function parseNairaToKobo(value: string | undefined): number | null {
  const trimmed = (value ?? '').trim().replace(/\.$/, ''); // allow "12." mid-typing
  if (!trimmed || !NAIRA_PATTERN.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** 10050 -> "100.50", 10000 -> "100". For pre-filling inputs. */
export function koboToNairaInput(kobo: number | null | undefined): string {
  if (kobo == null) return '';
  const whole = Math.floor(kobo / 100);
  const fraction = kobo % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

export const parseNairaPreview = parseNairaToKobo;
