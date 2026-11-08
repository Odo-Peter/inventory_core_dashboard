import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { MovementTable } from '@/features/inventory/stock/components/movement-table';
import { getMovementColumns } from '@/features/inventory/stock/components/movement-column';
import { dateTimeFormatter } from '@/features/admin/staff/utils';
import { movementFixtures } from '../../../helpers/stock';
import { buildPageMeta } from '../../../helpers/stock';

function renderTable({
  movements = movementFixtures,
  meta = buildPageMeta({ total: movementFixtures.length }),
  description = `${movements.length} movements`,
  emptyState,
  isLoading = false,
  isFetching = false,
  onRowClick = vi.fn(),
  onPageChange = vi.fn(),
  onFilterItem = vi.fn(),
}: {
  movements?: typeof movementFixtures;
  meta?: ReturnType<typeof buildPageMeta>;
  description?: string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  onRowClick?: (movement: (typeof movementFixtures)[number]) => void;
  onPageChange?: (page: number) => void;
  onFilterItem?: (itemId: string) => void;
} = {}) {
  render(
    <MemoryRouter>
      <MovementTable
        columns={getMovementColumns({ onFilterItem })}
        movements={movements}
        meta={meta}
        description={description}
        emptyState={emptyState}
        onRowClick={onRowClick}
        onPageChange={onPageChange}
        isLoading={isLoading}
        isFetching={isFetching}
      />
    </MemoryRouter>,
  );

  return { onRowClick, onPageChange, onFilterItem };
}

describe('MovementTable', () => {
  it('renders the movement ledger with formatted values', () => {
    renderTable();

    expect(screen.getByRole('heading', { name: 'Movements' })).toBeInTheDocument();
    expect(screen.getByText('4 movements')).toBeInTheDocument();
    for (const header of ['When', 'Item', 'Type', 'Change', 'By', 'Reference', 'Note']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }

    const receiveRow = screen.getAllByText('Coca-Cola 50cl')[0].closest('tr') as HTMLElement;
    expect(within(receiveRow).getByText('SKU-001')).toBeInTheDocument();
    expect(within(receiveRow).getByText('Restock')).toBeInTheDocument();
    expect(within(receiveRow).getByText('+12')).toBeInTheDocument();
    expect(within(receiveRow).getByText('Ada Okafor')).toBeInTheDocument();
    expect(within(receiveRow).getByText('Supplier delivery')).toBeInTheDocument();
    const when = dateTimeFormatter.format(new Date('2026-10-27T10:05:00.000Z'));
    expect(within(receiveRow).getByText(when)).toBeInTheDocument();
    expect(within(receiveRow).getByText(when)).toHaveAttribute(
      'dateTime',
      '2026-10-27T10:05:00.000Z',
    );
  });

  it('renders sale, refund, system, and empty note fallbacks', () => {
    renderTable();

    const saleRow = screen.getByText('Sale', { selector: 'span' }).closest('tr') as HTMLElement;
    expect(within(saleRow).getByText('−2')).toBeInTheDocument();
    expect(within(saleRow).getByText('System')).toBeInTheDocument();
    expect(within(saleRow).getAllByText('n/a')).toHaveLength(1);
    expect(within(saleRow).getByRole('link', { name: 'Sale #sale-123' })).toHaveAttribute(
      'href',
      '/sales?sale_id=sale-1234567890',
    );

    const damageRow = screen.getByText('Damage').closest('tr') as HTMLElement;
    expect(within(damageRow).getByText('−1')).toBeInTheDocument();
    expect(within(damageRow).getByText('Refund #refund-a')).toBeInTheDocument();
    expect(within(damageRow).getByText('Bottle broke')).toBeInTheDocument();
  });

  it('filters to an item without selecting the row', async () => {
    const user = userEvent.setup();
    const { onFilterItem, onRowClick } = renderTable();

    await user.click(screen.getAllByRole('button', { name: /Coca-Cola 50cl/ })[0]);

    expect(onFilterItem).toHaveBeenCalledWith('item-1');
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('opens the row when it is clicked', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByText('Bottle broke'));

    expect(onRowClick).toHaveBeenCalledWith(movementFixtures[2]);
  });

  it('does not select the row when the sale link is clicked', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByRole('link', { name: 'Sale #sale-123' }));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders pagination and reports page changes', async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderTable({
      meta: buildPageMeta({ page: 2, total: 50, total_pages: 3 }),
    });

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('dims the table while refetching', () => {
    const { container } = render(
      <MemoryRouter>
        <MovementTable
          columns={getMovementColumns({ onFilterItem: vi.fn() })}
          movements={movementFixtures}
          meta={buildPageMeta()}
          onPageChange={vi.fn()}
          isFetching
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.opacity-60')).toBeInTheDocument();
  });

  it('shows the default empty state while keeping headers', () => {
    renderTable({
      movements: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
      description: '0 movements',
    });

    expect(screen.getByText('No stock movements yet')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('accepts a custom empty state', () => {
    renderTable({
      movements: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
      emptyState: <span>No matches</span>,
    });

    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.queryByText('No stock movements yet')).not.toBeInTheDocument();
  });

  it('shows loading skeletons instead of rows', () => {
    const { container } = render(
      <MemoryRouter>
        <MovementTable
          columns={getMovementColumns({ onFilterItem: vi.fn() })}
          movements={[]}
          meta={buildPageMeta()}
          onPageChange={vi.fn()}
          isLoading
        />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('Coca-Cola 50cl')).not.toBeInTheDocument();
  });
});
