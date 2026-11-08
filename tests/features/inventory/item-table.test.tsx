import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { getItemColumns } from '@/features/inventory/items/column/item-column';
import { ItemTable } from '@/features/inventory/items/components/item-table';
import { formatNaira } from '@/features/admin/staff/utils';
import type { ItemResponse } from '@/features/inventory/items/types';
import {
  categoryFixtures,
  itemFixtures,
  itemMeta,
  makeItem,
  openItemRowActions,
} from '../../helpers/items';

function renderTable({
  items = itemFixtures,
  meta = itemMeta,
}: {
  items?: ItemResponse[];
  meta?: typeof itemMeta;
} = {}) {
  const callbacks = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onChangePrice: vi.fn(),
    onChangeImage: vi.fn(),
    onRemoveImage: vi.fn(),
    onRecordStock: vi.fn(),
    onDeactivate: vi.fn(),
    onReactivate: vi.fn(),
    onRowClick: vi.fn(),
    onPageChange: vi.fn(),
  };

  const categoryNames = Object.fromEntries(
    categoryFixtures.map((category) => [category.id, category.name]),
  );

  render(
    <MemoryRouter>
      <ItemTable
        columns={getItemColumns(callbacks, categoryNames)}
        items={items}
        meta={meta}
        description={`${items.length} items`}
        onRowClick={callbacks.onRowClick}
        onPageChange={callbacks.onPageChange}
      />
    </MemoryRouter>,
  );

  return callbacks;
}

describe('ItemTable', () => {
  it('renders item details, categories, stock warnings, and status badges', () => {
    renderTable();

    expect(screen.getByRole('heading', { name: 'All items' })).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Price' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Last updated' })).toBeInTheDocument();

    const colaRow = screen.getByText('Coca-Cola 50cl').closest('tr');
    expect(colaRow).not.toBeNull();
    expect(within(colaRow as HTMLElement).getByText('SKU-001')).toBeInTheDocument();
    expect(within(colaRow as HTMLElement).getByText('Beverages')).toBeInTheDocument();
    expect(within(colaRow as HTMLElement).getByText(formatNaira(1500))).toBeInTheDocument();
    expect(within(colaRow as HTMLElement).getByText('24 bottle')).toBeInTheDocument();
    expect(within(colaRow as HTMLElement).getByText('Active')).toBeInTheDocument();
    expect(within(colaRow as HTMLElement).queryByText('Low stock')).not.toBeInTheDocument();

    const fantaRow = screen.getByText('Fanta Orange 50cl').closest('tr');
    expect(fantaRow).not.toBeNull();
    expect(within(fantaRow as HTMLElement).getByText('Low stock')).toBeInTheDocument();
    expect(within(fantaRow as HTMLElement).getByText('Inactive')).toBeInTheDocument();

    const waterRow = screen.getByText('Bottled Water 75cl').closest('tr');
    expect(waterRow).not.toBeNull();
    expect(within(waterRow as HTMLElement).getByText('Uncategorized')).toBeInTheDocument();
  });

  it('shows an unknown category when the category cannot be resolved', () => {
    renderTable({
      items: [makeItem({ category_id: 'missing-category' })],
      meta: { ...itemMeta, total: 1 },
    });

    expect(screen.getByText('Unknown category')).toBeInTheDocument();
  });

  it('opens an item when its row is clicked', async () => {
    const user = userEvent.setup();
    const { onRowClick } = renderTable();

    await user.click(screen.getByText('Coca-Cola 50cl'));

    expect(onRowClick).toHaveBeenCalledWith(itemFixtures[0]);
  });

  it.each([
    ['View details', 'onView'],
    ['Edit details', 'onEdit'],
    ['Change price', 'onChangePrice'],
    ['Record stock movement', 'onRecordStock'],
    ['Deactivate item', 'onDeactivate'],
  ] as const)('invokes the %s row action without selecting the row', async (action, callback) => {
    const user = userEvent.setup();
    const callbacks = renderTable();

    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: action }));

    expect(callbacks[callback]).toHaveBeenCalledTimes(1);
    expect(callbacks[callback]).toHaveBeenCalledWith(itemFixtures[0]);
    expect(callbacks.onRowClick).not.toHaveBeenCalled();
  });

  it('renders the stock history link and reactivate action for inactive items', async () => {
    const user = userEvent.setup();
    const callbacks = renderTable();
    const fanta = itemFixtures[1];

    const menu = await openItemRowActions(user, 'Fanta Orange 50cl');
    const history = within(menu).getByRole('menuitem', { name: 'View stock history' });
    expect(history).toHaveAttribute('href', `/inventory/movements?item_id=${fanta.id}`);

    await user.click(within(menu).getByRole('menuitem', { name: 'Reactivate item' }));

    expect(callbacks.onReactivate).toHaveBeenCalledWith(fanta);
    expect(callbacks.onRowClick).not.toHaveBeenCalled();
  });

  it('does not select the row when the stock history link is clicked', async () => {
    const user = userEvent.setup();
    const callbacks = renderTable();

    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    await user.click(within(menu).getByRole('menuitem', { name: 'View stock history' }));

    expect(callbacks.onRowClick).not.toHaveBeenCalled();
  });

  it('moves between pages through the shared pagination controls', async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderTable({
      meta: { ...itemMeta, page: 2, total_pages: 3 },
    });

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('shows the empty state while keeping the table headers', () => {
    renderTable({ items: [], meta: { ...itemMeta, total: 0, total_pages: 0 } });

    expect(screen.getByText('No items found.')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
  });
});
