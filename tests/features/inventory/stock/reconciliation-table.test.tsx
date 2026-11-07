import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ReconciliationTable } from '@/features/inventory/stock/components/reconciliation-table';
import { getReconciliationColumns } from '@/features/inventory/stock/components/reconciliation-column';
import { buildPageMeta, reconciliationFixtures } from '../../../helpers/stock';

function renderTable({
  rows = reconciliationFixtures,
  meta = buildPageMeta({ total: reconciliationFixtures.length }),
  description = `${rows.length} items where cached stock differs from the ledger`,
  emptyState,
  onRowClick = vi.fn(),
  onPageChange = vi.fn(),
}: {
  rows?: typeof reconciliationFixtures;
  meta?: ReturnType<typeof buildPageMeta>;
  description?: string;
  emptyState?: React.ReactNode;
  onRowClick?: (row: (typeof reconciliationFixtures)[number]) => void;
  onPageChange?: (page: number) => void;
} = {}) {
  render(
    <MemoryRouter>
      <ReconciliationTable
        columns={getReconciliationColumns()}
        rows={rows}
        meta={meta}
        description={description}
        emptyState={emptyState}
        onRowClick={onRowClick}
        onPageChange={onPageChange}
      />
    </MemoryRouter>,
  );

  return { onRowClick, onPageChange };
}

describe('ReconciliationTable', () => {
  it('renders cached, ledger, and signed difference columns', () => {
    renderTable();

    expect(screen.getByRole('heading', { name: 'Items out of sync' })).toBeInTheDocument();
    expect(
      screen.getByText('2 items where cached stock differs from the ledger'),
    ).toBeInTheDocument();
    for (const header of ['Item', 'Cached stock', 'Ledger total', 'Difference', 'Ledger']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }

    const fantaRow = screen.getByText('Fanta Orange 50cl').closest('tr') as HTMLElement;
    expect(within(fantaRow).getByText('SKU-002')).toBeInTheDocument();
    expect(within(fantaRow).getByText('3')).toBeInTheDocument();
    expect(within(fantaRow).getByText('5')).toBeInTheDocument();
    expect(within(fantaRow).getByText('−2')).toBeInTheDocument();
    expect(within(fantaRow).getByRole('link', { name: 'View ledger' })).toHaveAttribute(
      'href',
      '/inventory/movements?item_id=item-2',
    );

    const waterRow = screen.getByText('Bottled Water 75cl').closest('tr') as HTMLElement;
    expect(within(waterRow).getByText('+5')).toBeInTheDocument();
  });

  it('opens a row when clicked', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByText('SKU-002'));

    expect(onRowClick).toHaveBeenCalledWith(reconciliationFixtures[0]);
  });

  it('does not select the row when the ledger link is clicked', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getAllByRole('link', { name: 'View ledger' })[0]);

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('paginates with the shared controls', async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderTable({
      meta: buildPageMeta({ page: 1, total: 40, total_pages: 2 }),
    });

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders the supplied empty state and keeps headers', () => {
    renderTable({
      rows: [],
      meta: buildPageMeta({ total: 0, total_pages: 0 }),
      emptyState: <span>Ledger and stock counts agree</span>,
    });

    expect(screen.getByText('Ledger and stock counts agree')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Difference' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });
});
