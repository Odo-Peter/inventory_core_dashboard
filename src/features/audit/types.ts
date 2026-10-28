export type ListAuditActionsResponse = {
  actions: string[];
};

export type AuditActorRole = 'cashier' | 'manager' | 'admin';

export type AuditActor = {
  id: string;
  name: string;
  staff_code: string;
  role: AuditActorRole;
};

export type AuditFilters = {
  action: string;
  entityType: string;
  actorId: string;
  entityId: string;
  from: string; // YYYY-MM-DD, local day
  to: string; // YYYY-MM-DD, local day
};

export type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  actor: AuditActor | null;
  details: Record<string, unknown> | null;
};

export type ListAuditsParams = {
  page?: number;
  page_size?: number;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  staff_id?: string;
  from?: string;
  to?: string;
};

export type ListAuditsMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ListAuditsResponse = {
  data: AuditLog[];
  meta: ListAuditsMeta;
};
