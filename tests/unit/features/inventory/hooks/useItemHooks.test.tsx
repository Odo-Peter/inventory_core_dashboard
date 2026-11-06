import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useListItems,
  useListItemUnits,
} from '@/features/inventory/category/hooks/useCategoryQueries';
import {
  useCreateItem,
  useDeactivateItem,
  useUpdateItem,
} from '@/features/inventory/category/hooks/useCategoryMutations';
import {
  createItem,
  deactivateItem,
  getItemUnits,
  listItems,
  updateItem,
} from '@/features/inventory/category/services/category.service';
import { queryKeys } from '@/lib/query-keys';
import type { CreateItemPayload } from '@/features/inventory/items/types';
import { itemFixtures, itemMeta, makeItem } from '../../../../helpers/items';

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn(),
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deactivateItem: vi.fn(),
  getItemUnits: vi.fn(),
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

describe('item queries and mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads items with the supplied query and exposes the response', async () => {
    const response = { data: itemFixtures, meta: itemMeta };
    const params = { page: 1, page_size: 25, active: true };
    vi.mocked(listItems).mockResolvedValue(response);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useListItems(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(listItems).toHaveBeenCalledWith(params);
  });

  it('selects the units array from the units response', async () => {
    vi.mocked(getItemUnits).mockResolvedValue({ units: ['bottle', 'pack'] });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useListItemUnits(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['bottle', 'pack']);
  });

  it('creates an item and invalidates item lists and audits', async () => {
    const payload: CreateItemPayload = {
      name: 'Fanta 50cl',
      unit: 'bottle',
      current_price: 1200,
    };
    vi.mocked(createItem).mockResolvedValue(itemFixtures[1]);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateItem(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(createItem).toHaveBeenCalledWith(payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.audits.all });
  });

  it('updates an item and invalidates list and detail caches', async () => {
    const updated = makeItem({ name: 'Coca-Cola Zero', active: false });
    vi.mocked(updateItem).mockResolvedValue(updated);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateItem(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'item-1',
        payload: { name: 'Coca-Cola Zero', active: false },
      });
    });

    expect(updateItem).toHaveBeenCalledWith('item-1', {
      name: 'Coca-Cola Zero',
      active: false,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.detail('item-1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.audits.all });
  });

  it('deactivates an item and invalidates list, detail, and audit caches', async () => {
    const deactivated = makeItem({ active: false });
    vi.mocked(deactivateItem).mockResolvedValue(deactivated);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeactivateItem(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('item-1');
    });

    expect(deactivateItem).toHaveBeenCalledWith('item-1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.items.detail('item-1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.audits.all });
  });
});
