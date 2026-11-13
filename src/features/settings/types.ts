import type { StoreResponse } from '@/features/admin/staff/types';

export type { StoreResponse, UpdateStorePayload } from '@/features/admin/staff/types';

/** Shape rendered by the store/settings form. Every field is a trimmed string. */
export interface StoreSettingsFormValues {
  name: string;
  address: string;
  phone: string;
  receipt_footer: string;
}

/** Convert a store response into form defaults. */
export function toStoreSettingsFormValues(store?: StoreResponse | null): StoreSettingsFormValues {
  return {
    name: store?.name ?? '',
    address: store?.address ?? '',
    phone: store?.phone ?? '',
    receipt_footer: store?.receipt_footer ?? '',
  };
}
