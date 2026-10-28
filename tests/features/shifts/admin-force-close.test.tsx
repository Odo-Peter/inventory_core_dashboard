import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminEndShiftDialog } from '@/features/shifts/components/admin-end-shift-dialog';
import { forceCloseShift } from '@/features/admin/services/admin.service';
import type { Shift } from '@/features/shifts/types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  forceCloseShift: vi.fn(),
}));

const openShift: Shift = {
  id: 'shift-1',
  store_id: 'store-1',
  staff_id: 'staff-2',
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
      <AdminEndShiftDialog open={true} onOpenChange={onOpenChange} shift={openShift} />
    </QueryClientProvider>,
  );
}

describe('Admin force close shift', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires reason and calls forceCloseShift', async () => {
    vi.mocked(forceCloseShift).mockResolvedValue({
      ...openShift,
      clock_out_at: '2026-10-27T18:00:00.000Z',
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Closing cash/i), '1500');
    const reasonInput = within(dialog).getByLabelText(/Reason/i);
    await user.type(reasonInput, 'Emergency');
    await user.click(within(dialog).getByRole('button', { name: 'End shift' }));

    expect(forceCloseShift).toHaveBeenCalledWith('shift-1', {
      closing_cash_counted: 150000,
      reason: 'Emergency',
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Shift ended');
    });
  });

  it('shows error toast on failure', async () => {
    vi.mocked(forceCloseShift).mockRejectedValue(new Error('forbidden'));
    const user = userEvent.setup();
    renderDialog();

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Closing cash/i), '1000');
    await user.type(within(dialog).getByLabelText(/Reason/i), 'Test');
    await user.click(within(dialog).getByRole('button', { name: 'End shift' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('forbidden');
    });
  });
});
