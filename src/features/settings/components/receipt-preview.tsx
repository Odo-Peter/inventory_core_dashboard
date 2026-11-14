import { ReceiptView } from '@/features/sales/components/receipt-view';
import type { ReceiptResponse } from '@/features/sales/types';

import type { StoreResponse, StoreSettingsFormValues } from '../types';

const PREVIEW_CREATED_AT = '2026-01-01T12:00:00.000Z';

function buildPreviewReceipt(
  store: StoreResponse,
  values: StoreSettingsFormValues,
): ReceiptResponse {
  const footer = values.receipt_footer.trim();

  return {
    id: 'preview-receipt',
    print_number: 1,
    is_copy: false,
    printed_at: PREVIEW_CREATED_AT,
    sale: {
      id: 'preview-sale',
      store_id: store.id,
      receipt_number: 1042,
      shift_id: 'preview-shift',
      staff_id: 'preview-staff',
      staff_name: 'Sample Cashier',
      subtotal: 450000,
      tax_total: 0,
      total: 450000,
      payment_method: 'cash',
      item_count: 2,
      created_at: PREVIEW_CREATED_AT,
      items: [
        {
          id: 'preview-item-1',
          item_id: 'preview-product-1',
          sku: 'SKU-001',
          name: 'Sample item',
          unit: 'unit',
          unit_price: 300000,
          quantity: 1,
          tax_amount: 0,
          line_total: 300000,
        },
        {
          id: 'preview-item-2',
          item_id: 'preview-product-2',
          sku: 'SKU-002',
          name: 'Second item',
          unit: 'unit',
          unit_price: 150000,
          quantity: 1,
          tax_amount: 0,
          line_total: 150000,
        },
      ],
      payment: {
        id: 'preview-payment',
        method: 'cash',
        amount: 450000,
        pos_account_id: null,
        account_label: null,
      },
    },
    store: {
      name: values.name.trim() || store.name,
      address: values.address.trim() || null,
      phone: values.phone.trim() || null,
      currency: store.currency,
      receipt_footer: footer || null,
    },
  };
}

interface ReceiptPreviewProps {
  store: StoreResponse;
  values: StoreSettingsFormValues;
}

export function ReceiptPreview({ store, values }: ReceiptPreviewProps) {
  const receipt = buildPreviewReceipt(store, values);
  const footerEmpty = values.receipt_footer.trim() === '';

  return (
    <div className="flex flex-col gap-2">
      <ReceiptView receipt={receipt} className="border-border mx-0 rounded border px-3" />

      {footerEmpty ? (
        <p
          data-testid="receipt-footer-placeholder"
          className="text-muted-foreground text-center text-xs"
        >
          Your receipt footer will appear here.
        </p>
      ) : null}
    </div>
  );
}
