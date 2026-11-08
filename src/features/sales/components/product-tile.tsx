import { formatNaira } from '@/features/admin/staff/utils';
import { cn } from '@/lib/utils';

import type { ItemResponse } from '@/features/inventory/items/types';

import { isLowStock, isOutOfStock } from '../utils';
import { ProductImage } from './product-image';

interface ProductTileProps {
  item: ItemResponse;
  onSelect: (item: ItemResponse) => void;
}

export function ProductTile({ item, onSelect }: ProductTileProps) {
  const outOfStock = isOutOfStock(item);
  const lowStock = !outOfStock && isLowStock(item);

  const stockLabel = outOfStock ? 'Out of stock' : lowStock ? `${item.stock_quantity} left` : null;

  const ariaLabel = [
    item.name,
    `${formatNaira(item.current_price)} per ${item.unit}`,
    outOfStock ? 'out of stock' : lowStock ? `${item.stock_quantity} left` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      disabled={outOfStock}
      aria-label={ariaLabel}
      onClick={() => onSelect(item)}
      className={cn(
        'group bg-card hover:border-primary/50 focus-visible:border-ring flex flex-col overflow-hidden rounded-lg border text-left transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      <div className="bg-muted relative aspect-square w-full">
        <ProductImage
          variants={item.image}
          alt={item.name}
          className="h-full w-full transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {stockLabel ? (
          <span
            className={cn(
              'absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
              outOfStock
                ? 'bg-destructive text-white'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
            )}
          >
            {stockLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium" title={item.name}>
          {item.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatNaira(item.current_price)} / {item.unit}
        </p>
      </div>
    </button>
  );
}
