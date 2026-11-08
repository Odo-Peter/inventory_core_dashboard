import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MovementFiltersBar,
  type MovementFilters,
} from '@/features/inventory/stock/components/movement-filters';
import { STOCK_REASONS } from '@/features/inventory/stock/types';

process.env.TZ = 'UTC';

const emptyFilters: MovementFilters = {
  q: '',
  reasons: [],
  from: '',
  to: '',
  item_id: '',
};

function renderFilters({
  filters = emptyFilters,
  itemName,
  hasActiveFilters = false,
  onChange = vi.fn(),
  onClear = vi.fn(),
}: {
  filters?: MovementFilters;
  itemName?: string;
  hasActiveFilters?: boolean;
  onChange?: (patch: Partial<MovementFilters>) => void;
  onClear?: () => void;
} = {}) {
  const view = render(
    <MovementFiltersBar
      filters={filters}
      itemName={itemName}
      hasActiveFilters={hasActiveFilters}
      onChange={onChange}
      onClear={onClear}
    />,
  );

  return { onChange, onClear, ...view };
}

describe('MovementFiltersBar', () => {
  afterEach(() => vi.useRealTimers());

  it('toggles a reason on and off', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters({
      filters: { ...emptyFilters, reasons: ['sale'] },
    });

    const saleChip = screen.getByRole('button', { name: 'Sale' });
    expect(saleChip).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(onChange).toHaveBeenCalledWith({ reasons: ['sale', 'damage'] });

    await user.click(saleChip);
    expect(onChange).toHaveBeenCalledWith({ reasons: [] });
  });

  it('renders a chip for every stock reason', () => {
    renderFilters();

    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(STOCK_REASONS.length);
    for (const name of ['Sale', 'Restock', 'Refund', 'Damage', 'Adjustment', 'Opening stock']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('debounces the search input before emitting it', () => {
    vi.useFakeTimers();
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'cola' } });

    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith({ q: 'cola' });
  });

  it('cancels a pending debounced search when the input changes again', () => {
    vi.useFakeTimers();
    const { onChange } = renderFilters();

    const search = screen.getByLabelText('Search');
    fireEvent.change(search, { target: { value: 'co' } });
    vi.advanceTimersByTime(200);
    fireEvent.change(search, { target: { value: 'cola' } });
    vi.advanceTimersByTime(200);

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ q: 'cola' });
  });

  it('does not re-emit an unchanged or synced query', () => {
    vi.useFakeTimers();
    const { onChange } = renderFilters({ filters: { ...emptyFilters, q: 'cola' } });

    vi.advanceTimersByTime(500);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('adopts a query pushed in from the URL', () => {
    const { rerender } = renderFilters();

    expect(screen.getByLabelText('Search')).toHaveValue('');

    rerender(
      <MovementFiltersBar
        filters={{ ...emptyFilters, q: 'water' }}
        hasActiveFilters
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Search')).toHaveValue('water');
  });

  it('applies the 7-day preset using local date keys', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
    const user = userEvent.setup();
    const { onChange } = renderFilters();

    await user.click(screen.getByLabelText('Date range'));
    await user.click(await screen.findByRole('button', { name: '7 days' }));

    expect(onChange).toHaveBeenCalledWith({ from: '2026-11-01', to: '2026-11-07' });
  });

  it('applies the 30-day preset using local date keys', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
    const { onChange } = renderFilters();

    fireEvent.click(screen.getByLabelText('Date range'));
    fireEvent.click(screen.getByRole('button', { name: '30 days' }));

    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-09', to: '2026-11-07' });
  });

  it('shows the selected range and clears it from the picker', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters({
      filters: { ...emptyFilters, from: '2026-10-01', to: '2026-10-07' },
    });

    const trigger = screen.getByLabelText('Date range');
    expect(trigger).toHaveTextContent('Oct 1, 2026 to Oct 7, 2026');

    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith({ from: '', to: '' });
  });

  it('removes the item chip', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilters({
      filters: { ...emptyFilters, item_id: 'item-1' },
      itemName: 'Coca-Cola 50cl',
      hasActiveFilters: true,
    });

    await user.click(screen.getByRole('button', { name: /Item: Coca-Cola 50cl/ }));

    expect(onChange).toHaveBeenCalledWith({ item_id: '' });
  });

  it('falls back to a generic item label when the name is not loaded', () => {
    renderFilters({
      filters: { ...emptyFilters, item_id: 'item-9' },
      hasActiveFilters: true,
    });

    expect(screen.getByRole('button', { name: /Item: Selected item/ })).toBeInTheDocument();
  });

  it('only shows Reset when filters are active', async () => {
    const user = userEvent.setup();
    const { onChange, onClear } = renderFilters({ hasActiveFilters: true });

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides Reset while the filters are at their defaults', () => {
    renderFilters();

    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });
});
