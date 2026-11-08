import { useCallback, useMemo, useState } from 'react';

import type { ItemResponse } from '@/features/inventory/items/types';

import type { CartLine } from '../types';
import { clampQuantity } from '../utils';

/**
 * Client-side cart for the sales page. It stores item snapshots so prices and
 * names stay stable while the cashier works. No API calls happen here.
 */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((item: ItemResponse, quantity = 1) => {
    if (item.stock_quantity <= 0) return;

    setLines((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);

      if (!existing) {
        return [...prev, { item, quantity: clampQuantity(quantity, item.stock_quantity) }];
      }

      return prev.map((line) =>
        line.item.id === item.id
          ? {
              item,
              quantity: clampQuantity(line.quantity + quantity, item.stock_quantity),
            }
          : line,
      );
    });
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((line) =>
        line.item.id === itemId
          ? { ...line, quantity: clampQuantity(quantity, line.item.stock_quantity) }
          : line,
      ),
    );
  }, []);

  const remove = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((line) => line.item.id !== itemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  /**
   * Refresh the cart snapshots after the server says prices or stock changed.
   * Quantities are intentionally not clamped here so the checkout can flag the
   * offending lines and ask the cashier to review them.
   */
  const syncItems = useCallback((items: ItemResponse[]) => {
    setLines((prev) =>
      prev.map((line) => {
        const next = items.find((item) => item.id === line.item.id);
        return next ? { ...line, item: next } : line;
      }),
    );
  }, []);

  const quantityFor = useCallback(
    (itemId: string) => lines.find((line) => line.item.id === itemId)?.quantity ?? 0,
    [lines],
  );

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.item.current_price, 0),
    [lines],
  );

  return {
    lines,
    add,
    setQuantity,
    remove,
    clear,
    syncItems,
    quantityFor,
    count,
    total,
  };
}
