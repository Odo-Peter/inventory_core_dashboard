export type AuditActor = {
  id: string;
  name: string;
  staff_code: string;
  role: 'cashier' | 'manager' | 'admin';
};

export type AuditEvent = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  actor: AuditActor | null;
  details: Record<string, unknown> | null;
};

export type AuditFilters = {
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  from?: string;
  to?: string;
};

export type AuditListResponse = {
  data: AuditEvent[];
  next_cursor: string | null;
};
