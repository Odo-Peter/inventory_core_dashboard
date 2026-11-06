import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/shared/date-range-picker'; // adjust path
import { cn } from '@/lib/utils';
import { STOCK_REASONS, type StockReason } from '../types';
import { REASON_META } from '../lib/movement-utils';
import { Field } from '@/components/ui/field';

export interface MovementFilters {
  q: string;
  reasons: StockReason[];
  from: string; // YYYY-MM-DD or ''
  to: string;
  item_id: string;
}

interface Props {
  filters: MovementFilters;
  itemName?: string;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<MovementFilters>) => void;
  onClear: () => void;
}

export function MovementFiltersBar({
  filters,
  itemName,
  hasActiveFilters,
  onChange,
  onClear,
}: Props) {
  const [q, setQ] = useState(filters.q);

  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => onChange({ q }), 300);
    return () => clearTimeout(t);
  }, [q, filters.q, onChange]);

  const toggleReason = (reason: StockReason) => {
    const next = filters.reasons.includes(reason)
      ? filters.reasons.filter((r) => r !== reason)
      : [...filters.reasons, reason];
    onChange({ reasons: next });
  };

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Search" htmlFor="movement-search" className="w-full sm:max-w-sm sm:flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="movement-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Item, SKU or barcode"
              className="h-10 rounded-sm pl-9"
            />
          </div>
        </Field>

        <Field label="Date range" htmlFor="movement-date-range" className="w-full sm:w-64">
          <DateRangePicker
            id="movement-date-range"
            from={filters.from}
            to={filters.to}
            onChange={(range) => onChange(range)}
            className="bg-card rounded-sm"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-xs">Type</span>
        {STOCK_REASONS.map((reason) => {
          const active = filters.reasons.includes(reason);
          return (
            <button
              key={reason}
              type="button"
              aria-pressed={active}
              onClick={() => toggleReason(reason)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-transparent ' + REASON_META[reason].className
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {REASON_META[reason].label}
            </button>
          );
        })}

        {filters.item_id && (
          <button
            type="button"
            onClick={() => onChange({ item_id: '' })}
            className="bg-muted ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          >
            Item: {itemName ?? 'Selected item'}
            <X className="size-3" />
            <span className="sr-only">Remove item filter</span>
          </button>
        )}

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
