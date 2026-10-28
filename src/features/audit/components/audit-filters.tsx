import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { auditActionOptions, auditEntityTypeOptions } from '../mock/audit-api';
import type { AuditFilters } from '../types';
import { isValidUuid } from '../utils';

interface AuditFiltersBarProps {
  filters: AuditFilters;
  onChange: (filters: AuditFilters) => void;
  actorOptions: Array<{ value: string; label: string }>;
}

export function AuditFiltersBar({ filters, onChange, actorOptions }: AuditFiltersBarProps) {
  const [entityIdInput, setEntityIdInput] = useState(filters.entityId || '');
  const [entityIdError, setEntityIdError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setEntityIdInput(filters.entityId || '');
  }, [filters.entityId]);

  useEffect(() => {
    if (entityIdInput && !isValidUuid(entityIdInput)) {
      setEntityIdError('Enter a valid UUID');
    } else {
      setEntityIdError(null);
    }
    if (entityIdInput && isValidUuid(entityIdInput)) {
      if (entityIdInput !== (filters.entityId || '')) {
        onChange({ ...filters, entityId: entityIdInput });
      }
    } else if (entityIdInput === '' && filters.entityId) {
      onChange({ ...filters, entityId: '' });
    }
  }, [entityIdInput]);

  useEffect(() => {
    if (filters.from && filters.to) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);
      if (fromDate > toDate) {
        setDateError('From must be earlier than To');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [filters.from, filters.to]);

  const activeCount = [
    filters.action && filters.action !== 'all',
    filters.entityType && filters.entityType !== 'all',
    filters.actorId && filters.actorId !== 'all',
    filters.entityId,
    filters.from,
    filters.to,
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

  const clearFilters = () => {
    setEntityIdInput('');
    onChange({
      action: 'all',
      entityType: 'all',
      actorId: 'all',
      entityId: '',
      from: '',
      to: '',
    });
  };

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-action">Action</Label>
          <Select
            value={filters.action || 'all'}
            onValueChange={(value) => onChange({ ...filters, action: value || 'all' })}
          >
            <SelectTrigger id="audit-action" className="w-full">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              {auditActionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-35 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-entity-type">Entity type</Label>
          <Select
            value={filters.entityType || 'all'}
            onValueChange={(value) => onChange({ ...filters, entityType: value || 'all' })}
          >
            <SelectTrigger id="audit-entity-type" className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {auditEntityTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-actor">Actor</Label>
          <Select
            value={filters.actorId || 'all'}
            onValueChange={(value) => onChange({ ...filters, actorId: value || 'all' })}
          >
            <SelectTrigger id="audit-actor" className="w-full">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anyone</SelectItem>
              {actorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-55 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-entity-id">Entity ID</Label>
          <Input
            id="audit-entity-id"
            placeholder="UUID"
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            aria-invalid={!!entityIdError}
          />
          {entityIdError ? <p className="text-destructive text-xs">{entityIdError}</p> : null}
        </div>

        <div className="flex min-w-35 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-from">From</Label>
          <Input
            id="audit-from"
            type="date"
            value={filters.from || ''}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
          />
        </div>

        <div className="flex min-w-35 flex-1 flex-col gap-1.5">
          <Label htmlFor="audit-to">To</Label>
          <Input
            id="audit-to"
            type="date"
            value={filters.to || ''}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Clear filters
          </Button>
          {hasActiveFilters ? (
            <span className="text-muted-foreground text-xs">{activeCount} active</span>
          ) : null}
        </div>
      </div>
      {dateError ? <p className="text-destructive text-xs">{dateError}</p> : null}
    </div>
  );
}
