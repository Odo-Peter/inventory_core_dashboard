// This file fakes the backend. It will be replaced by the real GET /audit-logs endpoint.
import type { AuditEvent, AuditFilters, AuditListResponse } from '../types';

const ACTION_OPTIONS = [
  'staff.create',
  'staff.deactivate',
  'pin.reset',
  'auth.failed_login',
  'shift.start',
  'shift.close',
  'shift.force_closed',
];

const ENTITY_TYPES = ['Staff', 'Shift'];

const ACTORS = [
  { id: 'actor-1', name: 'Amara Nwosu', staff_code: 'STF-001', role: 'admin' as const },
  { id: 'actor-2', name: 'Tunde Bakare', staff_code: 'STF-002', role: 'manager' as const },
  { id: 'actor-3', name: 'Ifeoma Okoye', staff_code: 'STF-003', role: 'cashier' as const },
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + (days % 8), (days * 7) % 60, 0, 0);
  return date.toISOString();
}

function generateEvents(): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: 'evt-0001',
      created_at: daysAgo(0),
      action: 'auth.failed_login',
      entity_type: null,
      entity_id: null,
      actor: null,
      details: { reason: 'unknown_staff_code', attempted_staff_code: 'STF-999' },
    },
    {
      id: 'evt-0002',
      created_at: daysAgo(1),
      action: 'staff.create',
      entity_type: 'Staff',
      entity_id: '9f3e4a62-8b92-4f02-b7a8-92ab902f6401',
      actor: ACTORS[0],
      details: {
        staff_code: 'STF-010',
        first_name: 'Chika',
        last_name: 'Eze',
        role: 'cashier',
        phone: '+23480****567',
      },
    },
    {
      id: 'evt-0003',
      created_at: daysAgo(2),
      action: 'pin.reset',
      entity_type: 'Staff',
      entity_id: '7a902b64-42ad-4c86-b902-84ab902f7612',
      actor: ACTORS[0],
      details: { staff_code: 'STF-010', reason: 'locked_account' },
    },
    {
      id: 'evt-0004',
      created_at: daysAgo(3),
      action: 'shift.start',
      entity_type: 'Shift',
      entity_id: 'ab902f64-7a92-4b02-8c42-902ab7641203',
      actor: ACTORS[2],
      details: { opening_float: 150000, shift_type: 'morning' },
    },
    {
      id: 'evt-0005',
      created_at: daysAgo(4),
      action: 'shift.close',
      entity_type: 'Shift',
      entity_id: '64ab902f-8b42-4c76-9a02-764ab902f874',
      actor: ACTORS[1],
      details: { closing_cash_counted: 248500, variance: 3500, notes: 'Balanced' },
    },
    {
      id: 'evt-0006',
      created_at: daysAgo(5),
      action: 'staff.deactivate',
      entity_type: 'Staff',
      entity_id: '902ab764-42f8-4b92-8c02-7a902f648ab5',
      actor: ACTORS[1],
      details: { staff_code: 'STF-007', reason: 'resignation' },
    },
    {
      id: 'evt-0007',
      created_at: daysAgo(6),
      action: 'shift.force_closed',
      entity_type: 'Shift',
      entity_id: 'ab764902-8f42-4c92-7a02-b902f648ab06',
      actor: ACTORS[0],
      details: { reason: 'Emergency', closed_by: 'STF-001', items: ['cash', 'receipts'] },
    },
    {
      id: 'evt-0008',
      created_at: daysAgo(7),
      action: 'staff.create',
      entity_type: 'Staff',
      entity_id: '764ab902-42f8-4c92-7a06-902f648ab907',
      actor: ACTORS[1],
      details: null,
    },
    {
      id: 'evt-0009',
      created_at: daysAgo(8),
      action: 'shift.start',
      entity_type: 'Shift',
      entity_id: 'ab902764-8f42-4c92-7a08-b902f648ab98',
      actor: ACTORS[2],
      details: { opening_float: 100000 },
    },
    {
      id: 'evt-0010',
      created_at: daysAgo(9),
      action: 'pin.reset',
      entity_type: 'Staff',
      entity_id: '902ab764-8f42-4c92-7a09-f902648ab109',
      actor: ACTORS[0],
      details: { staff_code: 'STF-005' },
    },
  ];

  for (let i = 11; i <= 40; i++) {
    const actorIndex = i % 3;
    const action = ACTION_OPTIONS[i % ACTION_OPTIONS.length];
    events.push({
      id: `evt-${String(i).padStart(4, '0')}`,
      created_at: daysAgo(i),
      action,
      entity_type: ENTITY_TYPES[i % ENTITY_TYPES.length],
      entity_id: `entity-${i}-00000000-0000-0000-0000-000000000000`
        .replace('entity-', '')
        .padStart(36, '0')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
      actor: ACTORS[actorIndex],
      details: i % 5 === 0 ? null : { note: `Event ${i} details`, index: i },
    });
  }

  return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const ALL_EVENTS = generateEvents();

export const auditActionOptions = [
  { value: 'all', label: 'All actions' },
  { value: 'staff.create', label: 'Staff created' },
  { value: 'pin.reset', label: 'PIN reset' },
  { value: 'shift.start', label: 'Shift started' },
];

export const auditEntityTypeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Shift', label: 'Shift' },
];

export async function listAuditLogs(
  filters: AuditFilters = {},
  cursor?: string | null,
): Promise<AuditListResponse> {
  // Simulated delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Simulate error occasionally for error state testing - constant flag approach per requirements
  const simulateError = false;
  if (simulateError) {
    throw new Error('Failed to load audit logs');
  }

  let filtered = [...ALL_EVENTS];

  if (filters.action && filters.action !== 'all') {
    filtered = filtered.filter((event) => event.action === filters.action);
  }
  if (filters.entityType && filters.entityType !== 'all') {
    filtered = filtered.filter((event) => event.entity_type === filters.entityType);
  }
  if (filters.actorId && filters.actorId !== 'all') {
    filtered = filtered.filter((event) => event.actor?.id === filters.actorId);
  }
  if (filters.entityId && filters.entityId.trim()) {
    filtered = filtered.filter((event) => event.entity_id === filters.entityId.trim());
  }
  if (filters.from) {
    const fromDate = new Date(filters.from);
    filtered = filtered.filter((event) => new Date(event.created_at) >= fromDate);
  }
  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((event) => new Date(event.created_at) <= toDate);
  }

  const pageSize = 10;
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = filtered.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + pageSize;
  const next_cursor = nextIndex < filtered.length ? String(nextIndex) : null;

  return {
    data: page,
    next_cursor,
  };
}
