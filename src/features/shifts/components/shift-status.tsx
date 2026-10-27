import { useState } from 'react';
import { BookCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/features/admin/staff/utils';

import type { ShiftStartResponse } from '../types';
import { ShiftDetailsDrawer } from './shift-details-drawer';

interface ShiftStatusProps {
  shift: ShiftStartResponse;
  onEndShift?: () => void;
}

export function ShiftStatus({ shift, onEndShift }: ShiftStatusProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Badge variant="success">Open</Badge>
        <span>
          Shift open since{' '}
          <span className="font-medium tabular-nums">{formatTime(shift.clock_in_at)}</span>
        </span>
        <Button type="button" variant="secondary" onClick={() => setDetailsOpen(true)}>
          <BookCheck />
          Shift Details
        </Button>
      </div>

      <ShiftDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        shift={shift}
        onEndShift={onEndShift}
      />
    </>
  );
}
