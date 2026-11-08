import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '@/lib/axiosInstance';
import {
  adjustStock,
  getStockStatus,
  initializeStock,
  listReconciliation,
  listStockMovements,
  receiveStock,
  recordDamage,
  recordMovement,
} from '@/features/inventory/stock/services/stock.service';
import type { RecordMovementInput, StockMovementRecord } from '@/features/inventory/stock/types';
import {
  buildMovement,
  buildPageMeta,
  buildStockStatus,
  movementFixtures,
  reconciliationFixtures,
} from '../../../../helpers/stock';

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance);

const record: StockMovementRecord = {
  id: 'movement-9',
  item_id: 'item-1',
  quantity_change: 5,
  reason: 'restock',
  note: null,
  staff_id: 'staff-1',
  sale_id: null,
  refund_id: null,
  created_at: '2026-11-07T10:00:00.000Z',
};

describe('stock.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listStockMovements', () => {
    it('serialises reason arrays as a comma-separated query param', async () => {
      const response = { data: movementFixtures, meta: buildPageMeta({ total: 4 }) };
      mockedAxios.get.mockResolvedValue({ data: response });

      const result = await listStockMovements({
        page: 2,
        page_size: 25,
        reason: ['sale', 'damage'],
        item_id: 'item-1',
        search: 'cola',
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-07T23:59:59.999Z',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/inventory/movements', {
        params: {
          page: 2,
          page_size: 25,
          item_id: 'item-1',
          search: 'cola',
          from: '2026-10-01T00:00:00.000Z',
          to: '2026-10-07T23:59:59.999Z',
          reason: 'sale,damage',
        },
      });
      expect(result).toEqual(response);
    });

    it.each([undefined, []])('omits the reason param when it is %j', async (reason) => {
      mockedAxios.get.mockResolvedValue({
        data: { data: [], meta: buildPageMeta({ total: 0 }) },
      });

      await listStockMovements({ page: 1, page_size: 25, reason });

      expect(mockedAxios.get).toHaveBeenCalledWith('/inventory/movements', {
        params: { page: 1, page_size: 25 },
      });
    });
  });

  it('fetches an item stock status', async () => {
    const status = buildStockStatus();
    mockedAxios.get.mockResolvedValue({ data: status });

    await expect(getStockStatus('item-1')).resolves.toEqual(status);
    expect(mockedAxios.get).toHaveBeenCalledWith('/inventory/items/item-1/stock-status');
  });

  it('lists reconciliation rows with pagination', async () => {
    const response = { data: reconciliationFixtures, meta: buildPageMeta({ total: 2 }) };
    mockedAxios.get.mockResolvedValue({ data: response });

    await expect(listReconciliation({ page: 3, page_size: 10 })).resolves.toEqual(response);
    expect(mockedAxios.get).toHaveBeenCalledWith('/inventory/reconciliation', {
      params: { page: 3, page_size: 10 },
    });
  });

  it('posts each movement action to its dedicated endpoint', async () => {
    mockedAxios.post.mockResolvedValue({ data: record });

    await initializeStock('item-1', { quantity: 10, note: 'Opening count' });
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/inventory/items/item-1/initial', {
      quantity: 10,
      note: 'Opening count',
    });

    await receiveStock('item-1', {
      quantity: 6,
      supplier_name: 'Acme',
      delivery_reference: 'INV-1',
    });
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/inventory/items/item-1/receive', {
      quantity: 6,
      supplier_name: 'Acme',
      delivery_reference: 'INV-1',
    });

    await adjustStock('item-1', { quantity_change: -2, note: 'Recount' });
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/inventory/items/item-1/adjust', {
      quantity_change: -2,
      note: 'Recount',
    });

    await recordDamage('item-1', { quantity: 3, note: 'Broken bottles' });
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/inventory/items/item-1/damage', {
      quantity: 3,
      note: 'Broken bottles',
    });
  });

  const dispatchCases: [RecordMovementInput, string][] = [
    [{ itemId: 'item-1', action: 'initial', body: { quantity: 10 } }, 'initial'],
    [{ itemId: 'item-1', action: 'receive', body: { quantity: 5 } }, 'receive'],
    [{ itemId: 'item-1', action: 'adjust', body: { quantity_change: -1 } }, 'adjust'],
    [{ itemId: 'item-1', action: 'damage', body: { quantity: 2 } }, 'damage'],
  ];

  it.each(dispatchCases)(
    'dispatches the %s movement to the matching endpoint',
    async (input, action) => {
      mockedAxios.post.mockResolvedValue({ data: record });

      await expect(recordMovement(input)).resolves.toEqual(record);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/inventory/items/item-1/${action}`,
        input.body,
      );
    },
  );

  it('returns the movement created by the API', async () => {
    const movement = buildMovement();
    mockedAxios.post.mockResolvedValue({ data: movement });

    await expect(receiveStock('item-1', { quantity: 1 })).resolves.toEqual(movement);
  });
});
