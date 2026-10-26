import { cn } from 'cn';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { salesOverview } from '@/features/dashboard/data/dashboard-data';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const totals = salesOverview.map((point) => point.total);
const maxTotal = Math.max(...totals);
const weekTotal = totals.reduce((total, value) => total + value, 0);
const averageTotal = weekTotal / salesOverview.length;
const bestDay = salesOverview.reduce((best, point) => (point.total > best.total ? point : best));

export function SalesOverviewChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">Sales overview</CardTitle>
          <CardDescription className="text-xs">Last 7 days</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium tracking-tight tabular-nums">
            {currency.format(weekTotal)}
          </p>
          <p className="text-muted-foreground text-xs">Total</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          role="img"
          aria-label={`Sales over the last 7 days. Total ${currency.format(weekTotal)}. Best day ${bestDay.day} at ${currency.format(bestDay.total)}.`}
          className="flex flex-col gap-2"
        >
          <div className="relative h-44">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
            >
              <div className="border-border/60 border-t" />
              <div className="border-border/60 border-t" />
              <div className="border-border/60 border-t" />
              <div className="border-border/60 border-t" />
            </div>
            <div className="relative grid h-full grid-cols-7 items-end gap-2">
              {salesOverview.map((point) => {
                const isBestDay = point.day === bestDay.day;
                const height = Math.round((point.total / maxTotal) * 100);

                return (
                  <div key={point.day} className="flex h-full items-end justify-center">
                    <div
                      className={cn(
                        'w-full max-w-10 rounded-t-sm',
                        isBestDay ? 'bg-primary' : 'bg-chart-2/60',
                      )}
                      style={{ height: `${height}%` }}
                      title={`${point.day}: ${currency.format(point.total)}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-muted-foreground grid grid-cols-7 gap-2 text-center text-[11px]">
            {salesOverview.map((point) => (
              <span key={point.day} className={cn(point.day === bestDay.day && 'text-foreground')}>
                {point.day}
              </span>
            ))}
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
          <span>
            Best day: <span className="text-foreground font-medium">{bestDay.day}</span>
          </span>
          <span>
            Average day:{' '}
            <span className="text-foreground font-medium tabular-nums">
              {currency.format(averageTotal)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
