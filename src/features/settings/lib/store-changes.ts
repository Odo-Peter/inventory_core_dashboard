import type { StoreResponse, UpdateStorePayload } from '../types';
import type { StoreSettingsFormInput } from '../schemas/store-settings.schema';

/**
 * Optional values are compared after trimming so a blank field matches both
 * `null` and `''`. Only fields that actually changed are returned, which keeps
 * the PATCH body to what the user edited.
 */
const normalize = (value: string | null | undefined) => (value ?? '').trim();

export function getStoreChanges(
  values: StoreSettingsFormInput,
  store: StoreResponse,
): UpdateStorePayload {
  const changes: UpdateStorePayload = {};

  const name = normalize(values.name);
  if (name && name !== normalize(store.name)) changes.name = name;

  const address = normalize(values.address);
  if (address !== normalize(store.address)) changes.address = address;

  const phone = normalize(values.phone);
  if (phone !== normalize(store.phone)) changes.phone = phone;

  const receiptFooter = normalize(values.receipt_footer);
  if (receiptFooter !== normalize(store.receipt_footer)) {
    changes.receipt_footer = receiptFooter;
  }

  return changes;
}

export function hasStoreChanges(values: StoreSettingsFormInput, store: StoreResponse): boolean {
  return Object.keys(getStoreChanges(values, store)).length > 0;
}
