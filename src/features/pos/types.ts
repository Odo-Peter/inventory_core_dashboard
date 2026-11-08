import type { PaginationMeta } from '@/lib/pagination';

export type PosAccountType = 'pos_terminal' | 'bank_account';

export interface PosAccount {
  id: string;
  store_id: string;
  label: string;
  type: PosAccountType;
  details: Record<string, unknown>;
  active: boolean;
  created_by_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export const posAccountTypeOptions = [
  { value: 'pos_terminal', label: 'POS Terminal' },
  { value: 'bank_account', label: 'Bank Account' },
] as const;

export interface ListPosAccountsQuery {
  page?: number;
  page_size?: number;
  active?: boolean;
  type?: PosAccountType;
}

export interface PosAccountListResponse {
  data: PosAccount[];
  meta: PaginationMeta;
}

export interface CreatePosAccountPayload {
  label: string;
  type: string;
  details?: Record<string, unknown>;
}

export interface UpdatePosAccountPayload {
  label?: string;
  type?: string;
  details?: Record<string, unknown>;
}
