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

const compactUnit = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

/**
 * Compact kobo formatter for chart axes: 0 -> ₦0, 100000 -> ₦1k,
 * 150000 -> ₦1.5k, 100000000 -> ₦1M. Never throws.
 */
export function formatNairaCompact(kobo: number | null | undefined): string {
  if (kobo == null || !Number.isFinite(kobo)) return '₦0';

  const naira = kobo / 100;
  const sign = naira < 0 ? '-' : '';
  const absolute = Math.abs(naira);

  if (absolute >= 1_000_000) return `${sign}₦${compactUnit(absolute / 1_000_000)}M`;
  if (absolute >= 1_000) return `${sign}₦${compactUnit(absolute / 1_000)}k`;
  if (absolute === 0) return '₦0';

  return `${sign}₦${absolute.toFixed(2).replace(/\.?0+$/, '')}`;
}
