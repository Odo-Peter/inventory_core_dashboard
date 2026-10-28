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

export type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor: AuditActor;
  details: Record<string, unknown>;
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
