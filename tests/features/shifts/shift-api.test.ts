import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getActiveShift, startShift } from '@/features/shifts/mock/shift-api';

describe('mock shift API', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists an open shift across sign-out and sign-in for the same staff id', async () => {
    const pending = startShift('staff-1', 'store-1', {
      opening_float: 150_000,
      opening_notes: 'Morning start',
    });

    await vi.advanceTimersByTimeAsync(700);
    const shift = await pending;

    expect(shift).toMatchObject({
      store_id: 'store-1',
      staff_id: 'staff-1',
      clock_out_at: null,
      opening_float: 150_000,
      opening_notes: 'Morning start',
    });

    sessionStorage.setItem('stocktake_access_token', 'token');
    sessionStorage.clear();

    expect(await getActiveShift('staff-1')).toEqual(shift);
    expect(await getActiveShift('staff-2')).toBeNull();
  });

  it('does not allow a second open shift for the same staff member', async () => {
    const pending = startShift('staff-1', 'store-1', { opening_float: 0 });

    await expect(startShift('staff-1', 'store-1', { opening_float: 0 })).rejects.toThrow(
      'already have an open shift',
    );

    await vi.advanceTimersByTimeAsync(700);
    await pending;

    await expect(startShift('staff-1', 'store-1', { opening_float: 0 })).rejects.toThrow(
      'already have an open shift',
    );
  });
});
