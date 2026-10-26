import { describe, expect, it, vi, beforeEach } from 'vitest';
import axiosInstance from '@/lib/axiosInstance';
import { deactivateStaff, reactivateStaff } from '@/features/admin/services/admin.service';
import { makeStaff } from '../../../../helpers/staff';

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance);

describe('admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deactivateStaff', () => {
    it('posts to deactivate endpoint and returns staff data', async () => {
      const staff = makeStaff({ active: false });
      mockedAxios.post.mockResolvedValue({ data: staff });

      const result = await deactivateStaff('staff-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/staff/staff-1/deactivate');
      expect(result).toEqual(staff);
    });
  });

  describe('reactivateStaff', () => {
    it('posts to reactivate endpoint and returns staff data', async () => {
      const staff = makeStaff({ active: true });
      mockedAxios.post.mockResolvedValue({ data: staff });

      const result = await reactivateStaff('staff-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/staff/staff-1/reactivate');
      expect(result).toEqual(staff);
    });
  });
});
