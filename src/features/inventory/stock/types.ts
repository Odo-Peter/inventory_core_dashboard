import type { PaginationMeta } from '@/lib/pagination';

export const STOCK_REASONS = [
  'sale',
  'restock',
  'refund',
  'damage',
  'adjustment',
  'initial',
] as const;

export type StockReason = (typeof STOCK_REASONS)[number];

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity_change: number;
  reason: StockReason;
  note: string | null;
  staff_id: string | null;
  staff_name: string | null;
  sale_id: string | null;
  refund_id: string | null;
  created_at: string;
}

export interface MovementListResponse {
  data: StockMovement[];
  meta: PaginationMeta;
}

export interface ListMovementsQuery {
  page: number;
  page_size: number;
  item_id?: string;
  reason?: StockReason[];
  from?: string;
  to?: string;
  search?: string;
}

export interface StockStatus {
  item_id: string;
  active: boolean;
  stock_quantity: number;
  has_movements: boolean;
  opening_stock_allowed: boolean;
  receive_allowed: boolean;
}

export type MovementAction = 'receive' | 'adjust' | 'damage' | 'initial';

export type StockMovementRecord = Omit<StockMovement, 'item_name' | 'item_sku' | 'staff_name'>;

export interface InitialStockPayload {
  quantity: number;
  note?: string;
}

export interface ReceiveStockPayload {
  quantity: number;
  note?: string;
  supplier_name?: string;
  delivery_reference?: string;
}

export interface AdjustStockPayload {
  quantity_change: number;
  note?: string;
}

export interface DamageStockPayload {
  quantity: number;
  note?: string;
}

export type RecordMovementInput =
  | { itemId: string; action: 'initial'; body: InitialStockPayload }
  | { itemId: string; action: 'receive'; body: ReceiveStockPayload }
  | { itemId: string; action: 'adjust'; body: AdjustStockPayload }
  | { itemId: string; action: 'damage'; body: DamageStockPayload };

export interface ReconciliationRow {
  item_id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  movement_total: number;
  difference: number;
}

export interface ReconciliationListResponse {
  data: ReconciliationRow[];
  meta: PaginationMeta;
}

export interface ListReconciliationQuery {
  page: number;
  page_size: number;
}
