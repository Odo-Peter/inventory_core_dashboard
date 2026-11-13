import { describe, expect, it } from 'vitest';

import {
  SALE_FILTER_PARAM,
  emptySalesFilters,
  isPaymentMethod,
  readSalesFilters,
  toSalesParams,
} from '@/features/sales/components/filters';
import { resolveRange } from '@/features/inventory/stock/lib/movement-utils';

process.env.TZ = 'UTC';

describe('sales filters', () => {
  it('starts empty', () => {
    expect(emptySalesFilters).toEqual({
      q: '',
      from: '',
      to: '',
      payment_method: '',
    });
  });

  it('maps every filter to its URL parameter', () => {
    expect(SALE_FILTER_PARAM).toEqual({
      q: 'q',
      from: 'from',
      to: 'to',
      payment_method: 'payment_method',
    });
  });

  it('reads valid filters from the URL', () => {
    const filters = readSalesFilters(
      new URLSearchParams({
        q: '1042',
        from: '2026-10-01',
        to: '2026-10-07',
        payment_method: 'card',
      }),
    );

    expect(filters).toEqual({
      q: '1042',
      from: '2026-10-01',
      to: '2026-10-07',
      payment_method: 'card',
    });
  });

  it('keeps only the digits of a receipt number and caps at nine', () => {
    expect(readSalesFilters(new URLSearchParams({ q: '#10-42abc' })).q).toBe('1042');
    expect(readSalesFilters(new URLSearchParams({ q: '1234567890123' })).q).toBe('123456789');
  });

  it('ignores hand-edited invalid dates and payment methods', () => {
    const filters = readSalesFilters(
      new URLSearchParams({
        from: '2026-13-40',
        to: 'tomorrow',
        payment_method: 'cheque',
      }),
    );

    expect(filters).toEqual({ q: '', from: '', to: '', payment_method: '' });
  });

  it('validates payment methods', () => {
    expect(isPaymentMethod('cash')).toBe(true);
    expect(isPaymentMethod('card')).toBe(true);
    expect(isPaymentMethod('bank_transfer')).toBe(true);
    expect(isPaymentMethod('cheque')).toBe(false);
    expect(isPaymentMethod('')).toBe(false);
  });

  it('always sends paging and omits empty filters', () => {
    expect(toSalesParams(emptySalesFilters, 1, 25)).toEqual({ page: 1, page_size: 25 });
  });

  it('maps the receipt number and payment method to API params', () => {
    expect(
      toSalesParams(
        { q: '1042', from: '', to: '', payment_method: 'bank_transfer', sale_id: 'sale_12345' },
        2,
        25,
      ),
    ).toEqual({
      page: 2,
      page_size: 25,
      q: '1042',
      payment_method: 'bank_transfer',
      sale_id: 'sale_12345',
    });
  });

  it('drops a receipt number that is not purely numeric', () => {
    expect(
      toSalesParams({ q: 'abc', from: '', to: '', payment_method: '', sale_id: '' }, 1, 25),
    ).not.toHaveProperty('q');
    expect(
      toSalesParams({ q: '10 42', from: '', to: '', payment_method: '', sale_id: '' }, 1, 25),
    ).not.toHaveProperty('q');
  });

  it('converts local day keys into the full ISO range the API expects', () => {
    const { from, to } = resolveRange('2026-10-01', '2026-10-07');

    expect(
      toSalesParams(
        { q: '', from: '2026-10-01', to: '2026-10-07', payment_method: '', sale_id: '' },
        1,
        25,
      ),
    ).toEqual({ page: 1, page_size: 25, from, to });

    expect(from).toBe('2026-10-01T00:00:00.000Z');
    expect(to).toBe('2026-10-07T23:59:59.999Z');
  });

  it('supports an open-ended range', () => {
    const { from } = resolveRange('2026-10-01', '');

    expect(
      toSalesParams({ q: '', from: '2026-10-01', to: '', payment_method: '', sale_id: '' }, 1, 25),
    ).toEqual({ page: 1, page_size: 25, from });
  });
});
