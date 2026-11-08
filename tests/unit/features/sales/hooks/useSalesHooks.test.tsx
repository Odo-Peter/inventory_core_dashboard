import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getItemByBarcode } from '@/features/inventory/category/services/category.service';
import {
  useBarcodeLookup,
  useListSales,
  usePaymentOptions,
  useSale,
  useSalesSummary,
} from '@/features/sales/hooks/useSalesQueries';
import { useCreateSale, usePrintSaleReceipt } from '@/features/sales/hooks/useSalesMutations';
import {
  createSale,
  getPaymentOptions,
  getSale,
  getSalesSummary,
  listSales,
  printSaleReceipt,
} from '@/features/sales/services/sales.service';
import type { CreateSalePayload } from '@/features/sales/types';
import { queryKeys } from '@/lib/query-keys';
import { makeItem } from '../../../../helpers/items';
import {
  makePaymentOptions,
  makeReceipt,
  makeSale,
  makeSaleListItem,
  salesMeta,
  salesSummary,
} from '../../../../helpers/sales';

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

vi.mock('@/features/inventory/category/services/category.service', () => ({
  getItemByBarcode: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, wrapper: Wrapper };
}

describe('sales queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a sales page with the supplied query', async () => {
    const response = { data: [makeSaleListItem()], meta: salesMeta };
    vi.mocked(listSales).mockResolvedValue(response);
    const params = { page: 2, page_size: 25, q: '1042' };
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useListSales(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(listSales).toHaveBeenCalledWith(params);
  });

  it('loads a sale detail when an id is provided', async () => {
    const sale = makeSale();
    vi.mocked(getSale).mockResolvedValue(sale);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSale('sale-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sale);
    expect(getSale).toHaveBeenCalledWith('sale-1');
  });

  it('does not request a sale when the id is null', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSale(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSale).not.toHaveBeenCalled();
  });

  it('loads payment options', async () => {
    const options = makePaymentOptions();
    vi.mocked(getPaymentOptions).mockResolvedValue(options);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePaymentOptions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(options);
  });

  it('loads a sales summary when enabled', async () => {
    vi.mocked(getSalesSummary).mockResolvedValue(salesSummary);
    const params = { from: '2026-11-01T00:00:00.000Z' };
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSalesSummary(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(salesSummary);
    expect(getSalesSummary).toHaveBeenCalledWith(params);
  });

  it('skips the summary request when disabled', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSalesSummary({}, false), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSalesSummary).not.toHaveBeenCalled();
  });

  it('looks items up by barcode through the category service', async () => {
    const item = makeItem();
    vi.mocked(getItemByBarcode).mockResolvedValue(item);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBarcodeLookup(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1234567890');
    });

    expect(getItemByBarcode).toHaveBeenCalledWith('1234567890');
    await waitFor(() => expect(result.current.data).toEqual(item));
  });
});

describe('sales mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a sale and invalidates sales and items', async () => {
    const sale = makeSale();
    const payload: CreateSalePayload = {
      items: [{ item_id: 'item-1', quantity: 2 }],
      payment_method: 'cash',
      expected_total: 3000,
      idempotency_key: 'key-1',
    };
    vi.mocked(createSale).mockResolvedValue(sale);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSale(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(createSale).toHaveBeenCalledWith(payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.sales.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.all });
  });

  it('stores the sale from a receipt print in the detail cache', async () => {
    const receipt = makeReceipt();
    vi.mocked(printSaleReceipt).mockResolvedValue(receipt);
    const { queryClient, wrapper } = createWrapper();
    const setQueryData = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => usePrintSaleReceipt(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('sale-1');
    });

    expect(printSaleReceipt).toHaveBeenCalledWith('sale-1');
    expect(setQueryData).toHaveBeenCalledWith(
      queryKeys.sales.detail(receipt.sale.id),
      receipt.sale,
    );
  });
});
