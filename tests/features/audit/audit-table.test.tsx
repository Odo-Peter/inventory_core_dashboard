import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { getAuditColumns } from '@/features/audit/components/audit-columns';
import { AuditTable } from '@/features/audit/components/audit-table';
import type { AuditLog, ListAuditsMeta } from '@/features/audit/types';

const events: AuditLog[] = [
  {
    id: 'audit-1',
    created_at: '2026-10-27T09:12:00.000Z',
    action: 'staff.created',
    entity_type: 'Staff',
    entity_id: 'staff-123456789',
    actor: {
      id: 'staff-1',
      name: 'Ada Okafor',
      staff_code: 'CASHIER001',
      role: 'cashier',
    },
    details: null,
  },
  {
    id: 'audit-2',
    created_at: '2026-10-26T18:40:00.000Z',
    action: 'auth.failed_login',
    entity_type: null,
    entity_id: null,
    actor: null,
    details: null,
  },
];

const meta: ListAuditsMeta = {
  page: 2,
  page_size: 25,
  total: 51,
  total_pages: 3,
};

function renderTable({
  data = events,
  tableMeta = meta,
  onView = vi.fn(),
  onRowClick = vi.fn(),
  onPageChange = vi.fn(),
  emptyState,
}: {
  data?: AuditLog[];
  tableMeta?: ListAuditsMeta;
  onView?: (event: AuditLog) => void;
  onRowClick?: (event: AuditLog) => void;
  onPageChange?: (page: number) => void;
  emptyState?: React.ReactNode;
} = {}) {
  render(
    <AuditTable
      columns={getAuditColumns(onView)}
      events={data}
      meta={tableMeta}
      description={`${tableMeta.total} events`}
      emptyState={emptyState}
      onRowClick={onRowClick}
      onPageChange={onPageChange}
    />,
  );

  return { onView, onRowClick, onPageChange };
}

describe('AuditTable', () => {
  it('renders audit rows, header, and pagination from the shared DataTable', () => {
    renderTable();

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByText('51 events')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'When' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actor' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Entity' })).toBeInTheDocument();

    const createdRow = screen.getByText('Staff created').closest('tr');
    expect(createdRow).not.toBeNull();
    expect(within(createdRow as HTMLElement).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(createdRow as HTMLElement).getByText('CASHIER001')).toBeInTheDocument();
    expect(within(createdRow as HTMLElement).getByText('Staff')).toBeInTheDocument();
    expect(within(createdRow as HTMLElement).getByText('staff-12')).toBeInTheDocument();

    const failedRow = screen.getByText('Failed sign-in').closest('tr');
    expect(failedRow).not.toBeNull();
    expect(within(failedRow as HTMLElement).getByText('System or unknown')).toBeInTheDocument();
    expect(within(failedRow as HTMLElement).getByText('n/a')).toBeInTheDocument();

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('calls onRowClick with the selected audit event', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByText('Staff created'));

    expect(onRowClick).toHaveBeenCalledWith(events[0]);
  });

  it('does not trigger onRowClick when the row action is used', async () => {
    const user = userEvent.setup();
    const { onView, onRowClick } = renderTable({ data: [events[0]] });

    await user.click(screen.getByRole('button', { name: /View details for Staff created/ }));

    expect(onView).toHaveBeenCalledWith(events[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('shows the custom empty state while keeping headers', () => {
    renderTable({
      data: [],
      tableMeta: { ...meta, total: 0, total_pages: 0 },
      emptyState: <p>No events match these filters</p>,
    });

    expect(screen.getByText('No events match these filters')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'When' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  it('shows the default empty state when none is provided', () => {
    renderTable({ data: [], tableMeta: { ...meta, total: 0, total_pages: 0 } });

    expect(screen.getByText('No audit events yet')).toBeInTheDocument();
  });
});
