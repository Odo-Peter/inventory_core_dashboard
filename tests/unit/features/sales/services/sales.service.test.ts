import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '@/lib/axiosInstance';
import {
  createSale,
  getPaymentOptions,
  getSale,
  getSalesSummary,
  listSales,
  printSaleReceipt,
} from '@/features/sales/services/sales.service';
import type { CreateSalePayload } from '@/features/sales/types';
import {
  makePaymentOptions,
  makeReceipt,
  makeSale,
  makeSaleListItem,
  salesSummary,
} from '../../../../helpers/sales';

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance);

describe('sales.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists sales with the supplied query parameters', async () => {
    const response = {
      data: [makeSaleListItem()],
      meta: { page: 2, page_size: 25, total: 26, total_pages: 2 },
    };
    mockedAxios.get.mockResolvedValue({ data: response });
    const params = {
      page: 2,
      page_size: 25,
      q: '1042',
      payment_method: 'card' as const,
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-07T23:59:59.999Z',
    };

    const result = await listSales(params);

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales', { params });
    expect(result).toEqual(response);
  });

  it('defaults the list query to an empty params object', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { data: [], meta: { page: 1, page_size: 25, total: 0, total_pages: 0 } },
    });

    await listSales();

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales', { params: {} });
  });

  it('loads a single sale by id', async () => {
    const sale = makeSale();
    mockedAxios.get.mockResolvedValue({ data: sale });

    const result = await getSale('sale-1');

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales/sale-1');
    expect(result).toEqual(sale);
  });

  it('creates a sale with the full payload', async () => {
    const sale = makeSale();
    const payload: CreateSalePayload = {
      items: [{ item_id: 'item-1', quantity: 2 }],
      payment_method: 'card',
      pos_account_id: 'terminal-1',
      expected_total: 3000,
      idempotency_key: 'key-1',
    };
    mockedAxios.post.mockResolvedValue({ data: sale });

    const result = await createSale(payload);

    expect(mockedAxios.post).toHaveBeenCalledWith('/sales', payload);
    expect(result).toEqual(sale);
  });

  it('loads the payment options', async () => {
    const options = makePaymentOptions();
    mockedAxios.get.mockResolvedValue({ data: options });

    const result = await getPaymentOptions();

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales/payment-options');
    expect(result).toEqual(options);
  });

  it('loads the sales summary with the supplied query parameters', async () => {
    mockedAxios.get.mockResolvedValue({ data: salesSummary });
    const params = { from: '2026-11-01T00:00:00.000Z', to: '2026-11-07T23:59:59.999Z' };

    const result = await getSalesSummary(params);

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales/summary', { params });
    expect(result).toEqual(salesSummary);
  });

  it('defaults the summary query to an empty params object', async () => {
    mockedAxios.get.mockResolvedValue({ data: salesSummary });

    await getSalesSummary();

    expect(mockedAxios.get).toHaveBeenCalledWith('/sales/summary', { params: {} });
  });

  it('records a receipt print for a sale', async () => {
    const receipt = makeReceipt();
    mockedAxios.post.mockResolvedValue({ data: receipt });

    const result = await printSaleReceipt('sale-1');

    expect(mockedAxios.post).toHaveBeenCalledWith('/sales/sale-1/receipt-prints');
    expect(result).toEqual(receipt);
  });
});
