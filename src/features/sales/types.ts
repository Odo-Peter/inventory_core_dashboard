import type { PaginationMeta } from '@/lib/pagination';

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SaleItem {
  id: string;
  item_id: string;
  sku: string;
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
  tax_amount: number;
  line_total: number;
}

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  pos_account_id: string | null;
  account_label: string | null;
}

export interface Sale {
  id: string;
  store_id: string;
  receipt_number: number;
  shift_id: string;
  staff_id: string;
  staff_name: string;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_method: PaymentMethod | null;
  item_count: number;
  created_at: string;
  items: SaleItem[];
  payment: SalePayment | null;
}

export type SaleListItem = Omit<Sale, 'items' | 'payment'>;

export interface ListSalesQuery {
  page?: number;
  page_size?: number;
  from?: string;
  to?: string;
  staff_id?: string;
  shift_id?: string;
  payment_method?: PaymentMethod;
  q?: string;
}

export interface ListSalesResponse {
  data: SaleListItem[];
  meta: PaginationMeta;
}

export interface PaymentAccount {
  id: string;
  label: string;
}

export interface PaymentMethodOption {
  method: PaymentMethod;
  accounts: PaymentAccount[];
}

export interface PaymentOptionsResponse {
  cash: PaymentMethodOption;
  card?: PaymentMethodOption;
  bank_transfer?: PaymentMethodOption;
}

export interface CreateSaleItemPayload {
  item_id: string;
  quantity: number;
}

export interface CreateSalePayload {
  items: CreateSaleItemPayload[];
  payment_method: PaymentMethod;
  pos_account_id?: string;
  expected_total: number;
  idempotency_key: string;
}

export interface ReceiptStore {
  name: string;
  address: string | null;
  phone: string | null;
  currency: string;
  receipt_footer: string | null;
}

export interface ReceiptResponse {
  id: string;
  print_number: number;
  is_copy: boolean;
  printed_at: string;
  sale: Sale;
  store: ReceiptStore;
}

export interface SalesSummaryPaymentMethod {
  method: PaymentMethod;
  count: number;
  amount: number;
}

export interface SalesSummaryResponse {
  sale_count: number;
  subtotal: number;
  tax_total: number;
  total: number;
  by_payment_method: SalesSummaryPaymentMethod[];
}

export interface SaleFilters {
  q: string;
  from: string; // YYYY-MM-DD, local day
  to: string;
  payment_method: string;
}

export interface SalesOverviewPaymentMethod {
  method: PaymentMethod;
  total: number;
  count: number;
}

export interface SalesOverviewDay {
  /** Calendar day in the store timezone, `YYYY-MM-DD`. */
  date: string;
  total: number;
  count: number;
}

export interface SalesOverviewToday extends SalesOverviewDay {
  by_method: SalesOverviewPaymentMethod[];
}

export interface SalesOverviewResponse {
  timezone: string;
  scope: 'own' | 'store';
  today: SalesOverviewToday;
  /** Exactly seven entries, oldest first, ending today in the store timezone. */
  daily: SalesOverviewDay[];
}

export interface CartLine {
  item: import('@/features/inventory/items/types').ItemResponse;
  quantity: number;
}
