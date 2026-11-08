import type { ImageVariantUrls } from '@/features/inventory/items/types';

import type { PaymentMethod } from './types';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
};

export function paymentMethodLabel(method: PaymentMethod | null | undefined) {
  return method ? (PAYMENT_METHOD_LABELS[method] ?? method) : '—';
}

export function productImageUrl(variants?: ImageVariantUrls | null) {
  if (!variants) return null;
  return variants.thumb ?? variants.full ?? variants.medium ?? variants.original ?? null;
}

/** True when the item should show the low-stock badge (a threshold of 0 disables it). */
export function isLowStock(item: { reorder_threshold: number; stock_quantity: number }) {
  return item.reorder_threshold > 0 && item.stock_quantity <= item.reorder_threshold;
}

export function isOutOfStock(item: { stock_quantity: number }) {
  return item.stock_quantity <= 0;
}

export function clampQuantity(quantity: number, max: number) {
  const safeMax = Math.max(1, Math.trunc(max));
  const safeQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;
  return Math.min(Math.max(safeQuantity, 1), safeMax);
}

export interface SaleErrorInfo {
  code?: string;
  message: string;
  field?: 'pos_account_id';
}

const CODE_MESSAGES: Record<string, string> = {
  no_open_shift: 'Clock in before making a sale',
  total_mismatch: 'Prices have changed. Review the new total before completing the sale.',
  insufficient_stock: 'Some items no longer have enough stock. Review the flagged lines.',
  item_inactive: 'Some items are no longer available. Remove the flagged lines.',
  payment_account_required: 'Choose an account for this payment method',
  payment_account_not_found: 'That account is no longer available. Choose another one.',
  payment_account_not_allowed: 'Cash sales cannot use a POS account.',
  invalid_payment_method: 'Choose a valid payment method',
  sale_total_too_large: 'This sale is too large to record. Reduce the quantities and try again.',
  idempotency_key_reused: 'This sale was already submitted. Close checkout and start a new sale.',
};

/**
 * The axios interceptor turns server errors into ApiError (`code`, `message`),
 * but tests and older callers may still pass a raw axios error. Support both.
 */
export function getSaleErrorInfo(error: unknown): SaleErrorInfo {
  const e = error as {
    code?: string;
    message?: string;
    response?: { data?: { code?: string; message?: string | string[] } };
  };

  const code = e?.response?.data?.code ?? e?.code;
  const rawMessage = e?.response?.data?.message;
  const serverMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

  const message =
    (code && CODE_MESSAGES[code]) ||
    serverMessage ||
    (error instanceof Error ? error.message : '') ||
    'Could not complete the sale';

  return {
    code,
    message,
    field:
      code === 'payment_account_required' || code === 'payment_account_not_found'
        ? 'pos_account_id'
        : undefined,
  };
}

/** Codes that mean the cart snapshot is stale and the grid should be refreshed. */
export function shouldRefreshItems(code?: string) {
  return code === 'total_mismatch' || code === 'insufficient_stock' || code === 'item_inactive';
}
