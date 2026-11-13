import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '@/lib/axiosInstance';
import { getCurrentStore, updateCurrentStore } from '@/features/settings/services/settings.service';
import { storeFixture } from '../../../../helpers/store';

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance);

describe('settings.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the current store from GET /stores/current', async () => {
    mockedAxios.get.mockResolvedValue({ data: storeFixture });

    const result = await getCurrentStore();

    expect(mockedAxios.get).toHaveBeenCalledWith('/stores/current');
    expect(result).toEqual(storeFixture);
  });

  it('patches PATCH /stores/current with only the changed fields', async () => {
    const updated = { ...storeFixture, name: 'Fresh Mart' };
    mockedAxios.patch.mockResolvedValue({ data: updated });

    const result = await updateCurrentStore({ name: 'Fresh Mart' });

    expect(mockedAxios.patch).toHaveBeenCalledWith('/stores/current', {
      name: 'Fresh Mart',
    });
    expect(result).toEqual(updated);
  });

  it('sends a cleared optional field as an empty string', async () => {
    mockedAxios.patch.mockResolvedValue({ data: storeFixture });

    await updateCurrentStore({ address: '', receipt_footer: '' });

    expect(mockedAxios.patch).toHaveBeenCalledWith('/stores/current', {
      address: '',
      receipt_footer: '',
    });
  });
});
