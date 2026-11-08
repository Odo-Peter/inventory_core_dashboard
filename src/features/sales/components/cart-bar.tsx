import { ShoppingCartIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatNaira } from '@/features/admin/staff/utils';

interface CartBarProps {
  count: number;
  total: number;
  disabled?: boolean;
  disabledReason?: string;
  onCheckout: () => void;
}

export function CartBar({ count, total, disabled, disabledReason, onCheckout }: CartBarProps) {
  if (count <= 0) return null;

  return (
    <div
      role="region"
      aria-label="Cart"
      className="bg-card/95 sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <ShoppingCartIcon aria-hidden="true" className="text-muted-foreground size-5" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
          <span className="text-lg font-semibold tabular-nums">{formatNaira(total)}</span>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={disabled}
        onClick={onCheckout}
        title={disabledReason}
      >
        Checkout
      </Button>
    </div>
  );
}
