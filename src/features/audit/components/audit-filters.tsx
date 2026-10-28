import { useEffect, useState } from 'react';

import { DateRangePicker } from '@/components/shared/date-range-picker';
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

import type { AuditFilters } from '../types';
import { isUuid } from './filters';

interface Option {
  value: string;
  label: string;
}

interface AuditFiltersBarProps {
  filters: AuditFilters;
  actionOptions: Option[];
  entityTypeOptions: Option[];
  actorOptions: Option[];
  hasActiveFilters: boolean;
  onChange: (patch: Partial<AuditFilters>) => void;
  onClear: () => void;
}

function FilterSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const items = [{ value: 'all', label: allLabel }, ...options];

  return (
    <Field label={label} htmlFor={id} className="w-full sm:w-48">
      <Select
        items={items}
        value={value || 'all'}
        onValueChange={(next) => {
          if (next) onChange(next === 'all' ? '' : next);
        }}
      >
        <SelectTrigger id={id} className="w-full data-[size=default]:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

// Only commits to the URL once the value is a valid UUID (or empty), so the
// API never receives a malformed id.
function EntityIdInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  const trimmed = local.trim();
  const invalid = trimmed !== '' && !isUuid(trimmed);

  useEffect(() => {
    if (trimmed === value || invalid) return;
    const timeout = setTimeout(() => onCommit(trimmed), 300);
    return () => clearTimeout(timeout);
  }, [trimmed, value, invalid, onCommit]);

  return (
    <Input
      htmlFor="audit-entity-id"
      label="Entity ID"
      placeholder="Paste a UUID"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      autoComplete="off"
      spellCheck={false}
      error={invalid}
      errorText={invalid ? 'Enter a valid UUID' : undefined}
      containerClassName="w-full sm:w-64"
    />
  );
}

export function AuditFiltersBar({
  filters,
  actionOptions,
  entityTypeOptions,
  actorOptions,
  hasActiveFilters,
  onChange,
  onClear,
}: AuditFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <FilterSelect
        id="audit-action"
        label="Action"
        allLabel="All actions"
        value={filters.action}
        options={actionOptions}
        onChange={(action) => onChange({ action })}
      />
      <FilterSelect
        id="audit-entity-type"
        label="Entity type"
        allLabel="All types"
        value={filters.entityType}
        options={entityTypeOptions}
        onChange={(entityType) => onChange({ entityType })}
      />
      <FilterSelect
        id="audit-actor"
        label="Actor"
        allLabel="Anyone"
        value={filters.actorId}
        options={actorOptions}
        onChange={(actorId) => onChange({ actorId })}
      />
      <EntityIdInput value={filters.entityId} onCommit={(entityId) => onChange({ entityId })} />
      <Field label="Date range" htmlFor="audit-date-range" className="w-full sm:w-64">
        <DateRangePicker
          id="audit-date-range"
          from={filters.from}
          to={filters.to}
          onChange={(range) => onChange(range)}
        />
      </Field>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClear} className="h-10 self-end">
          Clear filters
        </Button>
      )}
    </div>
  );
}
