import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseDateKey, toDateKey } from '@/features/audit/components/filters';

interface DateRangePickerProps {
  id?: string;
  from: string; // YYYY-MM-DD or ''
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
}

const LABEL_FORMAT = 'MMM d, yyyy';

export function DateRangePicker({ id, from, to, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const start = parseDateKey(from);
  const end = parseDateKey(to);
  const selected: DateRange | undefined = start ? { from: start, to: end } : undefined;

  const label = !start
    ? 'Pick a date range'
    : !end || toDateKey(end) === toDateKey(start)
      ? format(start, LABEL_FORMAT)
      : `${format(start, LABEL_FORMAT)} to ${format(end, LABEL_FORMAT)}`;

  const applyPreset = (days: number) => {
    const today = new Date();
    onChange({ from: toDateKey(addDays(today, -(days - 1))), to: toDateKey(today) });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'h-10 w-full justify-start gap-2 font-normal sm:w-64',
              !start && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={1}
          defaultMonth={start}
          selected={selected}
          disabled={{ after: new Date() }}
          onSelect={(range) =>
            onChange({
              from: range?.from ? toDateKey(range.from) : '',
              to: range?.to ? toDateKey(range.to) : '',
            })
          }
        />
        <div className="flex items-center justify-between gap-1 border-t p-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset(1)}>
              Today
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset(7)}>
              7 days
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset(30)}>
              30 days
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!start}
            onClick={() => {
              onChange({ from: '', to: '' });
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
