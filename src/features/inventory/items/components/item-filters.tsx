import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/form/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ItemFilters {
  q: string;
  active: string;
  category_id: string;
  low_stock: string;
}

interface ItemFiltersBarProps {
  filters: ItemFilters;
  categories: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onChange: (patch: Partial<ItemFilters>) => void;
  onClear: () => void;
}

function ItemSearchInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const trimmed = local.trim();

  useEffect(() => {
    if (trimmed === value) return;

    const timeout = setTimeout(() => onCommit(trimmed), 300);
    return () => clearTimeout(timeout);
  }, [trimmed, value, onCommit]);

  return (
    <Input
      id="item-search"
      htmlFor="item-search"
      label="Search items"
      placeholder="Search by name or SKU..."
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      autoComplete="off"
      spellCheck={false}
      containerClassName="bg-card w-full sm:w-64"
    />
  );
}

export function ItemFiltersBar({
  filters,
  categories,
  hasActiveFilters,
  onChange,
  onClear,
}: ItemFiltersBarProps) {
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const stockOptions = [
    { value: 'all', label: 'All stock levels' },
    { value: 'true', label: 'Low stock only' },
    { value: 'false', label: 'Exclude low stock' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <ItemSearchInput
        value={filters.q}
        onCommit={(q) => {
          if (q !== filters.q) onChange({ q });
        }}
      />

      <Field label="Category" htmlFor="item-category" className="w-full sm:w-48">
        <Select
          items={categoryOptions}
          value={filters.category_id || 'all'}
          onValueChange={(value) => {
            if (value) {
              const category_id = value === 'all' ? '' : value;
              if (category_id !== filters.category_id) onChange({ category_id });
            }
          }}
          modal={false}
        >
          <SelectTrigger
            id="item-category"
            className="bg-card w-full rounded-md data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Status" htmlFor="item-status" className="w-full sm:w-40">
        <Select
          items={statusOptions}
          value={filters.active || 'all'}
          onValueChange={(value) => {
            if (value) {
              const active = value === 'all' ? '' : value;
              if (active !== filters.active) onChange({ active });
            }
          }}
          modal={false}
        >
          <SelectTrigger
            id="item-status"
            className="bg-card w-full rounded-md data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Stock" htmlFor="item-stock" className="w-full sm:w-48">
        <Select
          items={stockOptions}
          value={filters.low_stock || 'all'}
          onValueChange={(value) => {
            if (value) {
              const low_stock = value === 'all' ? '' : value;
              if (low_stock !== filters.low_stock) onChange({ low_stock });
            }
          }}
          modal={false}
        >
          <SelectTrigger
            id="item-stock"
            className="bg-card w-full rounded-md data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {stockOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClear} className="h-10">
          Clear filters
        </Button>
      )}
    </div>
  );
}
