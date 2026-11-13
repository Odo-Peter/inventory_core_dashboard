import { describe, expect, it } from 'vitest';

import { getStoreChanges, hasStoreChanges } from '@/features/settings/lib/store-changes';
import type { StoreSettingsFormValues } from '@/features/settings/types';
import { makeStore, storeFixture } from '../../../helpers/store';

const savedValues: StoreSettingsFormValues = {
  name: storeFixture.name,
  address: storeFixture.address,
  phone: storeFixture.phone,
  receipt_footer: storeFixture.receipt_footer,
};

describe('getStoreChanges', () => {
  it('returns no changes when the form matches the saved store', () => {
    expect(getStoreChanges(savedValues, storeFixture)).toEqual({});
    expect(hasStoreChanges(savedValues, storeFixture)).toBe(false);
  });

  it('ignores whitespace-only differences around the saved values', () => {
    expect(
      getStoreChanges(
        {
          name: '  Main Store ',
          address: ' 1 Main Street  ',
          phone: ' +2348030000000  ',
          receipt_footer: ' Thank you for your custom ',
        },
        storeFixture,
      ),
    ).toEqual({});
  });

  it('returns only the field that changed', () => {
    expect(getStoreChanges({ ...savedValues, name: 'Fresh Mart' }, storeFixture)).toEqual({
      name: 'Fresh Mart',
    });
  });

  it('sends a cleared optional field as an empty string', () => {
    expect(getStoreChanges({ ...savedValues, address: '   ' }, storeFixture)).toEqual({
      address: '',
    });
  });

  it('treats a blank optional field as unchanged when the saved value is null or empty', () => {
    const nullAddressStore = makeStore({ address: null as unknown as string });
    const emptyPhoneStore = makeStore({ phone: '' });

    expect(getStoreChanges({ ...savedValues, address: '' }, nullAddressStore)).not.toHaveProperty(
      'address',
    );
    expect(getStoreChanges({ ...savedValues, phone: '  ' }, emptyPhoneStore)).not.toHaveProperty(
      'phone',
    );
  });

  it('does not resend a field that has been reverted to the saved value', () => {
    const changed = getStoreChanges({ ...savedValues, receipt_footer: 'New footer' }, storeFixture);

    expect(changed).toEqual({ receipt_footer: 'New footer' });
    expect(getStoreChanges(savedValues, storeFixture)).toEqual({});
  });

  it('combines multiple changed fields into one payload', () => {
    expect(
      getStoreChanges(
        {
          ...savedValues,
          name: ' Fresh Mart ',
          phone: '',
          receipt_footer: '',
        },
        storeFixture,
      ),
    ).toEqual({
      name: 'Fresh Mart',
      phone: '',
      receipt_footer: '',
    });
  });

  it('never sends a blank required name', () => {
    expect(getStoreChanges({ ...savedValues, name: '   ' }, storeFixture)).not.toHaveProperty(
      'name',
    );
  });
});
