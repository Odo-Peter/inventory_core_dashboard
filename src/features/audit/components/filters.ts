import { addDays, format, isValid, parse, startOfDay } from 'date-fns';

import type { AuditFilters } from '../types';
import type { ListAuditsParams } from '../types';

export const emptyAuditFilters: AuditFilters = {
  action: '',
  entityType: '',
  actorId: '',
  entityId: '',
  from: '',
  to: '',
};

// Browser URL param names match the API param names
export const FILTER_PARAM = {
  action: 'action',
  entityType: 'entity_type',
  actorId: 'staff_id',
  entityId: 'entity_id',
  from: 'from',
  to: 'to',
} as const satisfies Record<keyof AuditFilters, string>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);

const DATE_KEY = 'yyyy-MM-dd';
export const toDateKey = (date: Date) => format(date, DATE_KEY);

export function parseDateKey(value?: string) {
  if (!value) return undefined;
  const date = parse(value, DATE_KEY, new Date());
  return isValid(date) ? date : undefined;
}

export function readAuditFilters(searchParams: URLSearchParams): AuditFilters {
  const get = (key: keyof AuditFilters) => searchParams.get(FILTER_PARAM[key]) ?? '';
  const from = get('from');
  const to = get('to');

  return {
    action: get('action'),
    entityType: get('entityType'),
    actorId: get('actorId'),
    entityId: get('entityId'),
    // ignore hand-edited garbage in the URL
    from: parseDateKey(from) ? from : '',
    to: parseDateKey(to) ? to : '',
  };
}

/**
 * Maps UI filters to API params.
 * The API takes UTC ISO datetimes: `from` inclusive, `to` EXCLUSIVE.
 * Picking Oct 7 as the last day must therefore send the start of Oct 8 (local).
 * A lone `from` is treated as a single day.
 */
export function toAuditParams(
  filters: AuditFilters,
  page: number,
  pageSize: number,
): ListAuditsParams {
  const start = parseDateKey(filters.from);
  const end = parseDateKey(filters.to) ?? start;

  return {
    page,
    page_size: pageSize,
    action: filters.action || undefined,
    entity_type: filters.entityType || undefined,
    entity_id: isUuid(filters.entityId) ? filters.entityId : undefined,
    staff_id: isUuid(filters.actorId) ? filters.actorId : undefined,
    from: start ? startOfDay(start).toISOString() : undefined,
    to: end ? addDays(startOfDay(end), 1).toISOString() : undefined,
  };
}
