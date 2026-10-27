import { Badge } from '@/components/ui/badge';
import type { Shift } from '../mock/shift-api';

const timeFormatter = new Intl.DateTimeFormat('en-NG', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

function formatNaira(kobo: number) {
  return nairaFormatter.format(kobo / 100);
}

interface ShiftStatusProps {
  shift: Shift;
  staffCode?: string;
}

export function ShiftStatus({ shift, staffCode }: ShiftStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Badge variant="success">Open</Badge>
      <span>
        Shift open since{' '}
        <span className="font-medium tabular-nums">{formatTime(shift.clock_in_at)}</span>
      </span>
      <span aria-hidden="true" className="text-muted-foreground">
        ·
      </span>
      <span className="text-muted-foreground">
        Opening float{' '}
        <span className="text-foreground font-medium tabular-nums">
          {formatNaira(shift.opening_float)}
        </span>
      </span>
      {staffCode ? (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="text-muted-foreground">
            Staff <span className="text-foreground font-mono text-xs">{staffCode}</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
