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

export interface CategoryFilters {
  q: string;
  active: string;
}

interface CategoryFiltersBarProps {
  filters: CategoryFilters;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<CategoryFilters>) => void;
  onClear: () => void;
}

function CategorySearchInput({
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

    const timeout = setTimeout(() => {
      onCommit(trimmed);
    }, 300);

    return () => clearTimeout(timeout);
  }, [trimmed, value, onCommit]);

  return (
    <Input
      id="category-search"
      htmlFor="category-search"
      label="Search categories"
      placeholder="Search by name..."
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      autoComplete="off"
      spellCheck={false}
      containerClassName="bg-card"
    />
  );
}

export function CategoryFiltersBar({
  filters,
  hasActiveFilters,
  onChange,
  onClear,
}: CategoryFiltersBarProps) {
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <CategorySearchInput
        value={filters.q}
        onCommit={(q) => {
          if (q !== filters.q) onChange({ q });
        }}
      />

      <Field label="Status" htmlFor="category-status" className="w-full sm:w-48">
        <Select
          items={statusOptions}
          value={filters.active || 'all'}
          onValueChange={(next) => {
            if (next) {
              const active = next === 'all' ? '' : next;
              if (active !== filters.active) onChange({ active });
            }
          }}
          modal={false}
        >
          <SelectTrigger
            id="category-status"
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

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClear} className="h-10">
          Clear filters
        </Button>
      )}
    </div>
  );
}
