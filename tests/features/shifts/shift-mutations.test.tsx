import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEndShift, useStartShift } from '@/features/shifts/hooks/useShiftMutations';
import { useForceCloseShift } from '@/features/admin/hooks/useAdminMutations';
import { endShift, startShift } from '@/features/shifts/services/shift.service';
import { forceCloseShift } from '@/features/admin/services/admin.service';
import type { Shift } from '@/features/shifts/types';

vi.mock('@/features/shifts/services/shift.service', () => ({
  startShift: vi.fn(),
  endShift: vi.fn(),
  getCurrentShift: vi.fn(),
  getShifts: vi.fn(),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  forceCloseShift: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockShift: Shift = {
  id: 'shift-1',
  store_id: 'store-1',
  staff_id: 'staff-1',
  clock_in_at: '2026-10-27T09:12:00.000Z',
  clock_out_at: null,
  opening_float: 150000,
  closing_cash_counted: null,
  opening_notes: null,
  closing_notes: null,
  closed_by_staff_id: null,
  close_reason: '',
  created_at: '2026-10-27T09:12:00.000Z',
  updated_at: '2026-10-27T09:12:00.000Z',
};

describe('Shift mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStartShift calls startShift service with payload', async () => {
    vi.mocked(startShift).mockResolvedValue(mockShift);

    const { result } = renderHook(() => useStartShift('staff-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ opening_float: 150000 });

    expect(startShift).toHaveBeenCalledWith({ opening_float: 150000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('useEndShift calls endShift service with payload', async () => {
    const closedShift: Shift = { ...mockShift, clock_out_at: '2026-10-27T18:00:00.000Z' };
    vi.mocked(endShift).mockResolvedValue(closedShift);

    const { result } = renderHook(() => useEndShift('staff-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ closing_cash_counted: 200000 });

    expect(endShift).toHaveBeenCalledWith({ closing_cash_counted: 200000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('useForceCloseShift calls forceCloseShift service with id and payload', async () => {
    const closedShift: Shift = { ...mockShift, clock_out_at: '2026-10-27T18:00:00.000Z' };
    vi.mocked(forceCloseShift).mockResolvedValue(closedShift);

    const { result } = renderHook(() => useForceCloseShift('staff-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: 'shift-1',
      payload: { reason: 'Emergency', closing_cash_counted: 150000 },
    });

    expect(forceCloseShift).toHaveBeenCalledWith('shift-1', {
      reason: 'Emergency',
      closing_cash_counted: 150000,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
