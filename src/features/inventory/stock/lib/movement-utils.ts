import { parseDateKey } from '@/features/audit/components/filters';
import type { StockReason } from '../types';

export const REASON_META: Record<StockReason, { label: string; className: string }> = {
  sale: {
    label: 'Sale',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  restock: {
    label: 'Restock',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  refund: {
    label: 'Refund',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  },
  damage: {
    label: 'Damage',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  },
  adjustment: {
    label: 'Adjustment',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  },
  initial: {
    label: 'Opening stock',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  },
};

export function isReason(value: string): value is StockReason {
  return value in REASON_META;
}

export function formatSigned(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

/**
 * Converts the picker's YYYY-MM-DD keys into the full ISO datetimes (with "Z")
 * that the API requires. Day boundaries use the browser's local timezone:
 * `from` is the start of that day and `to` is the end of that day.
 */
export function resolveRange(from: string, to: string): { from?: string; to?: string } {
  const start = parseDateKey(from);
  const end = parseDateKey(to);

  return {
    ...(start ? { from: start.toISOString() } : {}),
    ...(end ? { to: new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString() } : {}),
  };
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
