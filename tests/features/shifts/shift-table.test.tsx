import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { getShiftColumns } from '@/features/admin/staff/columns/shift-column';
import { ShiftTable } from '@/features/shifts/components/shift-table';
import type { Shift, ListShiftsMeta } from '@/features/shifts/types';

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

const closedShift: Shift = {
  ...openShift,
  id: 'shift-2',
  clock_in_at: '2026-10-26T08:00:00.000Z',
  clock_out_at: '2026-10-26T17:00:00.000Z',
  opening_float: 50000,
  closing_cash_counted: 50000,
  created_at: '2026-10-26T08:00:00.000Z',
  updated_at: '2026-10-26T17:00:00.000Z',
};

const shifts: Shift[] = [openShift, closedShift];

const meta: ListShiftsMeta = {
  page: 1,
  page_size: 25,
  total: 2,
  total_pages: 2,
};

function renderTable({
  data = shifts,
  tableMeta = meta,
  onRowClick = vi.fn(),
  onPageChange = vi.fn(),
  emptyMessage,
}: {
  data?: Shift[];
  tableMeta?: ListShiftsMeta;
  onRowClick?: (shift: Shift) => void;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
} = {}) {
  render(
    <ShiftTable
      columns={getShiftColumns(vi.fn())}
      shifts={data}
      meta={tableMeta}
      description={`${tableMeta.total} shifts`}
      onRowClick={onRowClick}
      onPageChange={onPageChange}
      emptyMessage={emptyMessage}
    />,
  );

  return { onRowClick, onPageChange };
}

describe('ShiftTable', () => {
  it('renders shift rows, header, and pagination from the shared DataTable', () => {
    renderTable();

    expect(screen.getByRole('heading', { name: 'All shifts' })).toBeInTheDocument();
    expect(screen.getByText('2 shifts')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Clock in' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Clock out' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Starting cash' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Closing cash' })).toBeInTheDocument();

    const openRow = screen.getByText('Open').closest('tr');
    expect(openRow).not.toBeNull();
    expect(within(openRow as HTMLElement).getAllByText('—')).toHaveLength(2);

    const closedRow = screen.getByText('Closed').closest('tr');
    expect(closedRow).not.toBeNull();
    expect(within(closedRow as HTMLElement).getByText('Closed')).toBeInTheDocument();

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('calls onRowClick with the selected shift', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByText('Open'));

    expect(onRowClick).toHaveBeenCalledWith(openShift);
  });

  it('shows the custom empty message while keeping headers', () => {
    renderTable({
      data: [],
      tableMeta: { ...meta, total: 0, total_pages: 0 },
      emptyMessage: 'No shifts on this page.',
    });

    expect(screen.getByText('No shifts on this page.')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.queryByText('Page 1 of 0')).not.toBeInTheDocument();
  });
});
