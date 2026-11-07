import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useItemStockStatus,
  useListReconciliation,
  useListStockMovements,
  useReconciliationDriftCount,
} from '@/features/inventory/stock/hooks/useStockMovementQueries';
import { useRecordMovement } from '@/features/inventory/stock/hooks/useStockMovementMutations';
import {
  getStockStatus,
  listReconciliation,
  listStockMovements,
  recordMovement,
} from '@/features/inventory/stock/services/stock.service';
import { queryKeys } from '@/lib/query-keys';
import type { ListMovementsQuery } from '@/features/inventory/stock/types';
import {
  buildMovement,
  buildPageMeta,
  buildStockStatus,
  movementFixtures,
  reconciliationFixtures,
} from '../../../../helpers/stock';

vi.mock('@/features/inventory/stock/services/stock.service', () => ({
  listStockMovements: vi.fn(),
  getStockStatus: vi.fn(),
  listReconciliation: vi.fn(),
  recordMovement: vi.fn(),
  initializeStock: vi.fn(),
  receiveStock: vi.fn(),
  adjustStock: vi.fn(),
  recordDamage: vi.fn(),
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

describe('stock movement queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads movements with the supplied query', async () => {
    const response = { data: movementFixtures, meta: buildPageMeta({ total: 4 }) };
    const query: ListMovementsQuery = {
      page: 2,
      page_size: 25,
      reason: ['sale'],
      search: 'cola',
    };
    vi.mocked(listStockMovements).mockResolvedValue(response);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useListStockMovements(query), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(listStockMovements).toHaveBeenCalledWith(query);
  });

  it('does not fetch stock status without an item id', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useItemStockStatus(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getStockStatus).not.toHaveBeenCalled();
  });

  it('fetches stock status once an item id is available', async () => {
    const status = buildStockStatus();
    vi.mocked(getStockStatus).mockResolvedValue(status);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useItemStockStatus('item-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(status);
    expect(getStockStatus).toHaveBeenCalledWith('item-1');
  });

  it('loads reconciliation rows', async () => {
    const response = { data: reconciliationFixtures, meta: buildPageMeta({ total: 2 }) };
    vi.mocked(listReconciliation).mockResolvedValue(response);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useListReconciliation({ page: 1, page_size: 25 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(listReconciliation).toHaveBeenCalledWith({ page: 1, page_size: 25 });
  });

  it('selects only the drift total for the nav badge', async () => {
    vi.mocked(listReconciliation).mockResolvedValue({
      data: reconciliationFixtures,
      meta: buildPageMeta({ total: 7 }),
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useReconciliationDriftCount(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
    expect(listReconciliation).toHaveBeenCalledWith({ page: 1, page_size: 1 });
  });

  it('does not load the drift count when disabled', () => {
    const { wrapper } = createWrapper();

    renderHook(() => useReconciliationDriftCount(false), { wrapper });

    expect(listReconciliation).not.toHaveBeenCalled();
  });
});

describe('useRecordMovement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records the movement and invalidates movement, status, item, and audit caches', async () => {
    const movement = buildMovement();
    vi.mocked(recordMovement).mockResolvedValue(movement);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRecordMovement(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        itemId: 'item-1',
        action: 'receive',
        body: { quantity: 6 },
      });
    });

    expect(vi.mocked(recordMovement).mock.calls[0]?.[0]).toEqual({
      itemId: 'item-1',
      action: 'receive',
      body: { quantity: 6 },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.movementKeys.all });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.movementKeys.status('item-1'),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.audits.all });
  });

  it('does not invalidate anything when the request fails', async () => {
    vi.mocked(recordMovement).mockRejectedValue(new Error('insufficient_stock'));
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRecordMovement(), { wrapper });

    await expect(
      result.current.mutateAsync({
        itemId: 'item-1',
        action: 'damage',
        body: { quantity: 99 },
      }),
    ).rejects.toThrow('insufficient_stock');

    expect(invalidate).not.toHaveBeenCalled();
  });
});
