import type {
  PaymentOptionsResponse,
  ReceiptResponse,
  ReceiptStore,
  Sale,
  SaleItem,
  SaleListItem,
  SalesSummaryResponse,
} from '@/features/sales/types';
import type { PaginationMeta } from '@/lib/pagination';

export const saleItems: SaleItem[] = [
  {
    id: 'sale-item-1',
    item_id: 'item-1',
    sku: 'SKU-001',
    name: 'Coca-Cola 50cl',
    unit: 'bottle',
    unit_price: 1500,
    quantity: 2,
    tax_amount: 0,
    line_total: 3000,
  },
  {
    id: 'sale-item-2',
    item_id: 'item-2',
    sku: 'SKU-002',
    name: 'Bottled Water 75cl',
    unit: 'pack',
    unit_price: 800,
    quantity: 1,
    tax_amount: 0,
    line_total: 800,
  },
];

export function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    store_id: 'store-1',
    receipt_number: 1042,
    shift_id: 'shift-1',
    staff_id: 'staff-1',
    staff_name: 'Ada Okafor',
    subtotal: 3800,
    tax_total: 0,
    total: 3800,
    payment_method: 'cash',
    item_count: 2,
    created_at: '2026-11-08T10:15:30.000Z',
    items: saleItems,
    payment: {
      id: 'payment-1',
      method: 'cash',
      amount: 3800,
      pos_account_id: null,
      account_label: null,
    },
    ...overrides,
  };
}

export function makeSaleListItem(overrides: Partial<SaleListItem> = {}): SaleListItem {
  const sale = makeSale();

  return {
    id: sale.id,
    store_id: sale.store_id,
    receipt_number: sale.receipt_number,
    shift_id: sale.shift_id,
    staff_id: sale.staff_id,
    staff_name: sale.staff_name,
    subtotal: sale.subtotal,
    tax_total: sale.tax_total,
    total: sale.total,
    payment_method: sale.payment_method,
    item_count: sale.item_count,
    created_at: sale.created_at,
    ...overrides,
  };
}

export const receiptStore: ReceiptStore = {
  name: 'Test Store',
  address: '1 Main Street',
  phone: '+2348030000000',
  currency: 'NGN',
  receipt_footer: 'Thank you for your custom',
};

export function makeReceipt(overrides: Partial<ReceiptResponse> = {}): ReceiptResponse {
  return {
    id: 'receipt-1',
    print_number: 1,
    is_copy: false,
    printed_at: '2026-11-08T10:16:02.000Z',
    sale: makeSale(),
    store: receiptStore,
    ...overrides,
  };
}

export const paymentOptions: PaymentOptionsResponse = {
  cash: { method: 'cash', accounts: [] },
  card: {
    method: 'card',
    accounts: [{ id: 'terminal-1', label: 'Terminal 1' }],
  },
  bank_transfer: {
    method: 'bank_transfer',
    accounts: [
      { id: 'bank-1', label: 'GTBank' },
      { id: 'bank-2', label: 'Access Bank' },
    ],
  },
};

export function makePaymentOptions(
  overrides: Partial<PaymentOptionsResponse> = {},
): PaymentOptionsResponse {
  return { ...paymentOptions, ...overrides };
}

export const salesMeta: PaginationMeta = {
  page: 1,
  page_size: 25,
  total: 2,
  total_pages: 1,
};

export const saleListFixtures: SaleListItem[] = [
  makeSaleListItem(),
  makeSaleListItem({
    id: 'sale-2',
    receipt_number: 1041,
    staff_name: 'Bola Adeyemi',
    payment_method: 'card',
    item_count: 1,
    total: 1500,
    created_at: '2026-11-07T15:20:00.000Z',
  }),
];

export const salesSummary: SalesSummaryResponse = {
  sale_count: 2,
  subtotal: 5300,
  tax_total: 0,
  total: 5300,
  by_payment_method: [
    { method: 'card', count: 1, amount: 1500 },
    { method: 'cash', count: 1, amount: 3800 },
  ],
};
