import type { StoreResponse } from '@/features/admin/staff/types';

export function makeStore(overrides: Partial<StoreResponse> = {}): StoreResponse {
  return {
    id: 'store-1',
    name: 'Main Store',
    address: '1 Main Street',
    phone: '+2348030000000',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    receipt_footer: 'Thank you for your custom',
    active: true,
    created_at: '2026-01-15T09:30:00.000Z',
    updated_at: '2026-01-15T09:30:00.000Z',
    ...overrides,
  };
}

export const storeFixture = makeStore();
