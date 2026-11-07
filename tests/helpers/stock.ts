import type { PaginationMeta } from '@/lib/pagination';
import type {
  ReconciliationRow,
  StockMovement,
  StockStatus,
} from '@/features/inventory/stock/types';

export function buildPageMeta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    page_size: 25,
    total: 1,
    total_pages: 1,
    ...overrides,
  };
}

const defaultMovement: StockMovement = {
  id: 'movement-1',
  item_id: 'item-1',
  item_name: 'Coca-Cola 50cl',
  item_sku: 'SKU-001',
  quantity_change: 12,
  reason: 'restock',
  note: 'Supplier delivery',
  staff_id: 'staff-1',
  staff_name: 'Ada Okafor',
  sale_id: null,
  refund_id: null,
  created_at: '2026-10-27T10:05:00.000Z',
};

export function buildMovement(overrides: Partial<StockMovement> = {}): StockMovement {
  return { ...defaultMovement, ...overrides };
}

export const movementFixtures: StockMovement[] = [
  defaultMovement,
  buildMovement({
    id: 'movement-2',
    quantity_change: -2,
    reason: 'sale',
    note: null,
    staff_id: null,
    staff_name: null,
    sale_id: 'sale-1234567890',
    created_at: '2026-10-26T09:00:00.000Z',
  }),
  buildMovement({
    id: 'movement-3',
    quantity_change: -1,
    reason: 'damage',
    note: 'Bottle broke',
    refund_id: 'refund-abcdef12',
    created_at: '2026-10-25T08:30:00.000Z',
  }),
  buildMovement({
    id: 'movement-4',
    item_id: 'item-2',
    item_name: 'Fanta Orange 50cl',
    item_sku: 'SKU-002',
    quantity_change: 5,
    reason: 'adjustment',
    note: 'Count correction',
    created_at: '2026-10-24T08:00:00.000Z',
  }),
];

const defaultReconciliationRow: ReconciliationRow = {
  item_id: 'item-1',
  sku: 'SKU-001',
  name: 'Coca-Cola 50cl',
  stock_quantity: 24,
  movement_total: 24,
  difference: 0,
};

export function buildReconciliationRow(
  overrides: Partial<ReconciliationRow> = {},
): ReconciliationRow {
  return { ...defaultReconciliationRow, ...overrides };
}

export const reconciliationFixtures: ReconciliationRow[] = [
  buildReconciliationRow({
    item_id: 'item-2',
    sku: 'SKU-002',
    name: 'Fanta Orange 50cl',
    stock_quantity: 3,
    movement_total: 5,
    difference: -2,
  }),
  buildReconciliationRow({
    item_id: 'item-3',
    sku: 'SKU-003',
    name: 'Bottled Water 75cl',
    stock_quantity: 40,
    movement_total: 35,
    difference: 5,
  }),
];

const defaultStockStatus: StockStatus = {
  item_id: 'item-1',
  active: true,
  stock_quantity: 24,
  has_movements: true,
  opening_stock_allowed: false,
  receive_allowed: true,
};

export function buildStockStatus(overrides: Partial<StockStatus> = {}): StockStatus {
  return { ...defaultStockStatus, ...overrides };
}
