import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EndShiftDialog } from '@/features/shifts/components/end-shift-dialog';
import { endShift } from '@/features/shifts/services/shift.service';
import type { Shift } from '@/features/shifts/types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/shifts/services/shift.service', () => ({
  endShift: vi.fn(),
}));

const openShift: Shift = {
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

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EndShiftDialog open={true} onOpenChange={onOpenChange} shift={openShift} />
    </QueryClientProvider>,
  );
}

describe('EndShiftDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits closing cash as kobo and shows success toast', async () => {
    vi.mocked(endShift).mockResolvedValue({
      ...openShift,
      clock_out_at: '2026-10-27T18:00:00.000Z',
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Closing cash'), '20000.50');
    await user.click(within(dialog).getByRole('button', { name: 'End shift' }));

    expect(endShift).toHaveBeenCalledWith({ closing_cash_counted: 2000050 });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Shift ended');
    });
  });
});
