// This is the only file that fakes the shift backend. Replace its contents with
// calls to the real endpoints when the shift API is integrated.
const SHIFT_STORAGE_PREFIX = 'stocktake_open_shift:';
const START_DELAY_MS = 700;
const pendingStarts = new Set<string>();

export interface Shift {
  id: string;
  store_id: string;
  staff_id: string;
  clock_in_at: string;
  clock_out_at: null;
  opening_float: number;
  opening_notes: string | null;
}

export interface StartShiftInput {
  opening_float: number;
  opening_notes?: string;
}

function storageKey(staffId: string) {
  return `${SHIFT_STORAGE_PREFIX}${staffId}`;
}

function createShiftId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `shift-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readShift(staffId: string): Shift | null {
  try {
    const stored = localStorage.getItem(storageKey(staffId));
    if (!stored) return null;

    const shift = JSON.parse(stored) as Shift;
    if (shift.staff_id !== staffId || shift.clock_out_at !== null) return null;

    return shift;
  } catch {
    return null;
  }
}

export async function getActiveShift(staffId: string): Promise<Shift | null> {
  return readShift(staffId);
}

export async function startShift(
  staffId: string,
  storeId: string,
  input: StartShiftInput,
): Promise<Shift> {
  if (readShift(staffId) || pendingStarts.has(staffId)) {
    throw new Error('You already have an open shift.');
  }

  pendingStarts.add(staffId);

  try {
    await new Promise((resolve) => setTimeout(resolve, START_DELAY_MS));

    if (readShift(staffId)) {
      throw new Error('You already have an open shift.');
    }

    const shift: Shift = {
      id: createShiftId(),
      store_id: storeId,
      staff_id: staffId,
      clock_in_at: new Date().toISOString(),
      clock_out_at: null,
      opening_float: input.opening_float,
      opening_notes: input.opening_notes ?? null,
    };

    localStorage.setItem(storageKey(staffId), JSON.stringify(shift));

    return shift;
  } finally {
    pendingStarts.delete(staffId);
  }
}
