import { useState } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';

import { formatNaira } from '@/features/admin/staff/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ItemResponse } from '@/features/inventory/items/types';

import { clampQuantity, isLowStock, isOutOfStock } from '../utils';
import { ProductImage } from './product-image';

interface ItemSaleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemResponse | null;
  cartQuantity: number;
  onConfirm: (item: ItemResponse, quantity: number) => void;
}

export function ItemSaleDrawer({
  open,
  onOpenChange,
  item,
  cartQuantity,
  onConfirm,
}: ItemSaleDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">Add to cart</SheetTitle>
          <SheetDescription>Choose a quantity for this sale.</SheetDescription>
        </SheetHeader>

        {open && item ? (
          <ItemSaleForm
            item={item}
            cartQuantity={cartQuantity}
            onClose={() => onOpenChange(false)}
            onConfirm={(quantity) => {
              onConfirm(item, quantity);
              onOpenChange(false);
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ItemSaleForm({
  item,
  cartQuantity,
  onClose,
  onConfirm,
}: {
  item: ItemResponse;
  cartQuantity: number;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}) {
  const outOfStock = isOutOfStock(item);
  const max = Math.max(1, item.stock_quantity);
  const [quantity, setQuantity] = useState(() =>
    cartQuantity > 0 ? clampQuantity(cartQuantity, max) : 1,
  );

  const updateQuantity = (next: number) => setQuantity(clampQuantity(next, max));

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="aspect-square w-full overflow-hidden rounded-lg">
          <ProductImage
            variants={item.image}
            alt={item.name}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <p className="text-muted-foreground font-mono text-xs">{item.sku}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={outOfStock ? 'destructive' : item.active ? 'success' : 'secondary'}>
            {outOfStock ? 'Out of stock' : `${item.stock_quantity} in stock`}
          </Badge>
          {!outOfStock && isLowStock(item) ? <Badge variant="inactive">Low stock</Badge> : null}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Unit price
            </dt>
            <dd className="font-medium">{formatNaira(item.current_price)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Unit</dt>
            <dd>{item.unit}</dd>
          </div>
        </dl>

        {cartQuantity > 0 ? (
          <p className="text-muted-foreground text-xs">
            {cartQuantity} already in the cart. Choosing a new quantity replaces it.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Decrease quantity"
              disabled={quantity <= 1 || outOfStock}
              onClick={() => updateQuantity(quantity - 1)}
            >
              <MinusIcon />
            </Button>
            <output
              aria-live="polite"
              className="w-12 text-center text-xl font-semibold tabular-nums"
            >
              {quantity}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Increase quantity"
              disabled={quantity >= max || outOfStock}
              onClick={() => updateQuantity(quantity + 1)}
            >
              <PlusIcon />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Total: <span className="font-medium">{formatNaira(item.current_price * quantity)}</span>
          </p>
        </div>
      </div>

      <SheetFooter className="flex-row justify-end border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={outOfStock} onClick={() => onConfirm(quantity)}>
          {cartQuantity > 0 ? 'Update cart' : 'Add to cart'}
        </Button>
      </SheetFooter>
    </>
  );
}
