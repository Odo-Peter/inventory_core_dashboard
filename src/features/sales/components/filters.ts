import { parseDateKey } from '@/features/audit/components/filters';
import { resolveRange } from '@/features/inventory/stock/lib/movement-utils';

import { PAYMENT_METHODS, type ListSalesQuery, type PaymentMethod } from '../types';

export interface SalesFilters {
  q: string;
  from: string; // YYYY-MM-DD
  to: string;
  payment_method: string;
}

export const emptySalesFilters: SalesFilters = {
  q: '',
  from: '',
  to: '',
  payment_method: '',
};

export const SALE_FILTER_PARAM = {
  q: 'q',
  from: 'from',
  to: 'to',
  payment_method: 'payment_method',
} as const satisfies Record<keyof SalesFilters, string>;

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function readSalesFilters(searchParams: URLSearchParams): SalesFilters {
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const paymentMethod = searchParams.get('payment_method') ?? '';
  const receipt = (searchParams.get('q') ?? '').replace(/\D/g, '').slice(0, 9);

  return {
    q: receipt,
    // Ignore hand-edited garbage in the URL.
    from: parseDateKey(from) ? from : '',
    to: parseDateKey(to) ? to : '',
    payment_method: isPaymentMethod(paymentMethod) ? paymentMethod : '',
  };
}

/**
 * Maps URL filters to API params. The movement page's resolveRange gives the
 * full ISO datetimes with local day boundaries that the API expects.
 */
export function toSalesParams(
  filters: SalesFilters,
  page: number,
  pageSize: number,
): ListSalesQuery {
  const { from, to } = resolveRange(filters.from, filters.to);
  const receipt = filters.q.trim();

  return {
    page,
    page_size: pageSize,
    ...(/^\d{1,9}$/.test(receipt) ? { q: receipt } : {}),
    ...(isPaymentMethod(filters.payment_method) ? { payment_method: filters.payment_method } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}
