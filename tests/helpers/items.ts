import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CategoryResponse } from '@/features/inventory/category/types';
import type {
  ItemResponse,
  ListItemsQuery,
  ListItemsResponse,
} from '@/features/inventory/items/types';
import type { PaginationMeta } from '@/lib/pagination';

type User = ReturnType<typeof userEvent.setup>;

const defaultItem: ItemResponse = {
  id: 'item-1',
  store_id: 'store-1',
  sku: 'SKU-001',
  barcode: '1234567890',
  image_key: null,
  name: 'Coca-Cola 50cl',
  category_id: 'category-1',
  unit: 'bottle',
  current_price: 1500,
  cost_price: 1000,
  stock_quantity: 24,
  reorder_threshold: 5,
  active: true,
  created_at: '2026-10-20T09:00:00.000Z',
  updated_at: '2026-10-27T10:00:00.000Z',
};

export function makeItem(overrides: Partial<ItemResponse> = {}): ItemResponse {
  return { ...defaultItem, ...overrides };
}

/** Alias used by the stock tests, which need an item factory but not item fixtures. */
export const buildItem = makeItem;

export const itemFixtures: ItemResponse[] = [
  defaultItem,
  makeItem({
    id: 'item-2',
    sku: 'SKU-002',
    barcode: null,
    name: 'Fanta Orange 50cl',
    category_id: 'category-1',
    current_price: 1200,
    cost_price: null,
    stock_quantity: 3,
    reorder_threshold: 5,
    active: false,
    updated_at: '2026-10-26T08:30:00.000Z',
  }),
  makeItem({
    id: 'item-3',
    sku: 'SKU-003',
    name: 'Bottled Water 75cl',
    category_id: null,
    unit: 'pack',
    current_price: 800,
    cost_price: 500,
    stock_quantity: 40,
    reorder_threshold: 10,
    active: true,
    updated_at: '2026-10-25T14:15:00.000Z',
  }),
];

export const categoryFixtures: CategoryResponse[] = [
  {
    id: 'category-1',
    store_id: 'store-1',
    name: 'Beverages',
    active: true,
    created_at: '2026-09-01T09:00:00.000Z',
    updated_at: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'category-2',
    store_id: 'store-1',
    name: 'Snacks',
    active: true,
    created_at: '2026-09-02T09:00:00.000Z',
    updated_at: '2026-09-02T09:00:00.000Z',
  },
];

export const itemMeta: PaginationMeta = {
  page: 1,
  page_size: 25,
  total: itemFixtures.length,
  total_pages: 1,
};

export function listItemsResponse(
  items: ItemResponse[] = itemFixtures,
  meta: PaginationMeta = itemMeta,
): ListItemsResponse {
  return { data: items, meta };
}

export function expectedItemQuery(overrides: Partial<ListItemsQuery> = {}): ListItemsQuery {
  return { page: 1, page_size: 25, ...overrides };
}

export async function openItemRowActions(user: User, itemName: string) {
  await user.click(screen.getByRole('button', { name: `Actions for item ${itemName}` }));
  return screen.findByRole('menu');
}
