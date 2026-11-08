import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCart } from '@/features/sales/hooks/useCart';
import { makeItem } from '../../../../helpers/items';

describe('useCart', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.lines).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('adds an item with the requested quantity and computes count and total', () => {
    const { result } = renderHook(() => useCart());
    const item = makeItem({ current_price: 1500, stock_quantity: 10 });

    act(() => result.current.add(item, 2));

    expect(result.current.lines).toEqual([{ item, quantity: 2 }]);
    expect(result.current.quantityFor(item.id)).toBe(2);
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(3000);
  });

  it('merges repeated adds and clamps the quantity to available stock', () => {
    const { result } = renderHook(() => useCart());
    const item = makeItem({ current_price: 1500, stock_quantity: 3 });

    act(() => result.current.add(item, 2));
    act(() => result.current.add(item, 2));

    expect(result.current.lines).toHaveLength(1);
    expect(result.current.lines[0].quantity).toBe(3);
    expect(result.current.count).toBe(3);
  });

  it('ignores items that are out of stock', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.add(makeItem({ stock_quantity: 0 }), 1));

    expect(result.current.lines).toEqual([]);
  });

  it('never adds less than one of an item', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.add(makeItem({ stock_quantity: 4 }), 0));

    expect(result.current.lines[0].quantity).toBe(1);
  });

  it('clamps a manual quantity update between one and the stock count', () => {
    const { result } = renderHook(() => useCart());
    const item = makeItem({ stock_quantity: 4 });

    act(() => result.current.add(item, 1));

    act(() => result.current.setQuantity(item.id, 10));
    expect(result.current.lines[0].quantity).toBe(4);

    act(() => result.current.setQuantity(item.id, -2));
    expect(result.current.lines[0].quantity).toBe(1);
  });

  it('removes a line and clears the cart', () => {
    const { result } = renderHook(() => useCart());
    const first = makeItem({ id: 'item-1' });
    const second = makeItem({ id: 'item-2' });

    act(() => {
      result.current.add(first, 1);
      result.current.add(second, 2);
    });

    act(() => result.current.remove(first.id));
    expect(result.current.lines.map((line) => line.item.id)).toEqual([second.id]);

    act(() => result.current.clear());
    expect(result.current.lines).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('syncs item snapshots without clamping quantities so stale lines stay visible', () => {
    const { result } = renderHook(() => useCart());
    const item = makeItem({ current_price: 1500, stock_quantity: 10 });

    act(() => result.current.add(item, 5));

    const refreshed = makeItem({
      id: item.id,
      current_price: 2000,
      stock_quantity: 2,
      active: false,
    });

    act(() => result.current.syncItems([refreshed]));

    expect(result.current.lines).toEqual([{ item: refreshed, quantity: 5 }]);
    expect(result.current.total).toBe(10000);
  });

  it('keeps lines whose items are missing from a sync response', () => {
    const { result } = renderHook(() => useCart());
    const item = makeItem();

    act(() => result.current.add(item, 1));
    act(() => result.current.syncItems([]));

    expect(result.current.lines[0].item).toBe(item);
  });

  it('reports zero for an item that is not in the cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.quantityFor('missing')).toBe(0);
  });
});
