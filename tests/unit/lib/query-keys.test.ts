import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/query-keys';
import type { ListSalesQuery } from '@/features/sales/types';

describe('queryKeys.store', () => {
  it('exposes one stable current-store key', () => {
    expect(queryKeys.store.current).toEqual(['current-store']);
    expect(queryKeys.store.current).toBe(queryKeys.store.current);
  });
});

describe('queryKeys.sales', () => {
  it('exposes a stable root key', () => {
    expect(queryKeys.sales.all).toEqual(['sales']);
  });

  it('nests list keys under the root and prefixes', () => {
    const params: ListSalesQuery = { page: 1, page_size: 25 };

    expect(queryKeys.sales.lists()).toEqual(['sales', 'list']);
    expect(queryKeys.sales.list(params)).toEqual(['sales', 'list', params]);
  });

  it('nests detail keys under the root and prefixes', () => {
    expect(queryKeys.sales.details()).toEqual(['sales', 'detail']);
    expect(queryKeys.sales.detail('sale-1')).toEqual(['sales', 'detail', 'sale-1']);
  });

  it('nests summary keys under the root and prefixes', () => {
    const params: ListSalesQuery = { from: '2026-11-01T00:00:00.000Z' };

    expect(queryKeys.sales.summaries()).toEqual(['sales', 'summary']);
    expect(queryKeys.sales.summary(params)).toEqual(['sales', 'summary', params]);
  });

  it('keeps payment options under the root', () => {
    expect(queryKeys.sales.paymentOptions).toEqual(['sales', 'payment-options']);
  });

  it('distinguishes list, detail, summary, and payment option keys', () => {
    const keys = [
      queryKeys.sales.lists(),
      queryKeys.sales.detail('sale-1'),
      queryKeys.sales.summary({}),
      queryKeys.sales.paymentOptions,
    ];

    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length);
  });

  it('produces the same key for equal list params and different keys for different pages', () => {
    expect(queryKeys.sales.list({ page: 1 })).toEqual(queryKeys.sales.list({ page: 1 }));
    expect(queryKeys.sales.list({ page: 1 })).not.toEqual(queryKeys.sales.list({ page: 2 }));
  });
});
