import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ItemFiltersBar,
  type ItemFilters,
} from '@/features/inventory/items/components/item-filters';
import { categoryFixtures } from '../../helpers/items';

const emptyFilters: ItemFilters = {
  q: '',
  active: '',
  category_id: '',
  low_stock: '',
};

function renderFilters({
  filters = emptyFilters,
  hasActiveFilters = false,
  onChange = vi.fn(),
  onClear = vi.fn(),
}: {
  filters?: ItemFilters;
  hasActiveFilters?: boolean;
  onChange?: (patch: Partial<ItemFilters>) => void;
  onClear?: () => void;
} = {}) {
  render(
    <ItemFiltersBar
      filters={filters}
      categories={categoryFixtures}
      hasActiveFilters={hasActiveFilters}
      onChange={onChange}
      onClear={onClear}
    />,
  );

  return { onChange, onClear };
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('ItemFiltersBar', () => {
  it('debounces the search input before committing the query', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.type(screen.getByLabelText('Search items'), 'cola');

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ q: 'cola' }), {
      timeout: 1500,
    });
  });

  it('trims search input and does not re-emit an unchanged query', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters({ filters: { ...emptyFilters, q: 'cola' } });

    const search = screen.getByLabelText('Search items');
    await user.clear(search);
    await user.type(search, '  cola  ');

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits status, category, and stock filter changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await chooseOption(user, 'Status', 'Inactive');
    expect(onChange).toHaveBeenCalledWith({ active: 'false' });

    await chooseOption(user, 'Category', 'Snacks');
    expect(onChange).toHaveBeenCalledWith({ category_id: 'category-2' });

    await chooseOption(user, 'Stock', 'Low stock only');
    expect(onChange).toHaveBeenCalledWith({ low_stock: 'true' });
  });

  it('maps the all option back to an empty filter value', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters({
      filters: { ...emptyFilters, active: 'false' },
    });

    await chooseOption(user, 'Status', 'All statuses');

    expect(onChange).toHaveBeenCalledWith({ active: '' });
  });

  it('only shows the clear action when filters are active', async () => {
    const user = userEvent.setup();
    const { onClear } = renderFilters({ hasActiveFilters: true });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides the clear action when no filters are active', () => {
    renderFilters();

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});
