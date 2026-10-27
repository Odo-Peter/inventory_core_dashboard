export interface ShiftStartResponse {
  id: string;
  store_id: string;
  staff_id: string;
  clock_in_at: string;
  clock_out_at: string;
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
  limit?: number;
  cursor?: string;
};

export type ListShiftsResponse = {
  data: ShiftStartResponse[];
  next_cursor?: string | null;
};
