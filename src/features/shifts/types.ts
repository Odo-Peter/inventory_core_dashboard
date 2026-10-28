export interface Shift {
  id: string;
  store_id: string;
  staff_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  opening_float: number;
  closing_cash_counted: number | null;
  opening_notes: string | null;
  closing_notes: string | null;
  closed_by_staff_id: string | null;
  close_reason: string;
  created_at: string;
  updated_at: string;
}

export type ListShiftsParams = {
  staff_id?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
};

export type ListShiftsMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ListShiftsResponse = {
  data: Shift[];
  meta: ListShiftsMeta;
};
