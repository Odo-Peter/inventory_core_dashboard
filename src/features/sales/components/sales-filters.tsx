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

import { PAYMENT_METHODS, type PaymentMethod } from '../types';
import { paymentMethodLabel } from '../utils';
import type { SalesFilters } from './filters';

interface SalesFiltersBarProps {
  filters: SalesFilters;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<SalesFilters>) => void;
  onClear: () => void;
}

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All methods' },
  ...PAYMENT_METHODS.map((method) => ({
    value: method,
    label: paymentMethodLabel(method as PaymentMethod),
  })),
];

export function SalesFiltersBar({
  filters,
  hasActiveFilters,
  onChange,
  onClear,
}: SalesFiltersBarProps) {
  const [receipt, setReceipt] = useState(filters.q);

  useEffect(() => setReceipt(filters.q), [filters.q]);

  useEffect(() => {
    if (receipt === filters.q) return;
    const timeout = setTimeout(() => onChange({ q: receipt }), 300);
    return () => clearTimeout(timeout);
  }, [receipt, filters.q, onChange]);

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Input
        htmlFor="sales-receipt-number"
        label="Receipt number"
        type="search"
        inputMode="numeric"
        placeholder="e.g. 1042"
        value={receipt}
        onChange={(event) => setReceipt(event.target.value.replace(/\D/g, '').slice(0, 9))}
        containerClassName="w-full sm:w-48 bg-card"
        autoComplete="off"
      />

      <Field label="Date range" htmlFor="sales-date-range" className="w-full sm:w-64">
        <DateRangePicker
          id="sales-date-range"
          from={filters.from}
          to={filters.to}
          onChange={(range) => onChange(range)}
          className="bg-card rounded-sm"
        />
      </Field>

      <Field label="Payment method" htmlFor="sales-payment-method" className="w-full sm:w-48">
        <Select
          items={PAYMENT_OPTIONS}
          value={filters.payment_method || 'all'}
          onValueChange={(value) => {
            if (value) onChange({ payment_method: value === 'all' ? '' : value });
          }}
          modal={false}
        >
          <SelectTrigger
            id="sales-payment-method"
            className="bg-card w-full rounded-sm data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="rounded-sm">
            {PAYMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {hasActiveFilters ? (
        <Button type="button" variant="ghost" onClick={onClear} className="h-10 self-end">
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
