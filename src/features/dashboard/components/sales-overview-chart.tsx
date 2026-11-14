import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeSeriesChart } from '@/components/shared/charts';
import { formatNaira } from '@/features/admin/staff/utils';
import { formatNairaCompact } from '@/lib/money';
import { useCan } from '@/lib/rbac';

import { useSalesOverview } from '../hooks/useDashboardQueries';
import { formatDateKey } from '../lib/date-key';

export function SalesOverviewChart() {
  const canView = useCan('salesOverview');
  const { data, isLoading, isError, refetch } = useSalesOverview();

  const summary = useMemo(() => {
    const daily = data?.daily ?? [];
    const points = daily.map((day) => ({ date: day.date, total: day.total }));
    const weekTotal = daily.reduce((sum, day) => sum + day.total, 0);
    const bestDay = daily.reduce<(typeof daily)[number] | null>(
      (best, day) => (best === null || day.total > best.total ? day : best),
      null,
    );
    const hasSales = weekTotal > 0;

    return {
      points,
      weekTotal,
      bestDay,
      bestLabel: bestDay ? formatDateKey(bestDay.date) : '—',
      hasSales,
      average: Math.round(weekTotal / Math.max(daily.length, 1)),
    };
  }, [data]);

  if (!canView) return null;

  const { points, weekTotal, bestDay, bestLabel, hasSales, average } = summary;
  const ariaLabel = hasSales
    ? `Sales over the last 7 days. Total ${formatNaira(weekTotal)}. Best day ${bestLabel} at ${formatNaira(bestDay?.total ?? 0)}.`
    : `Sales over the last 7 days. No sales. Total ${formatNaira(0)}.`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">Sales overview</CardTitle>
          <CardDescription className="text-xs">Last 7 days</CardDescription>
        </div>
        <div className="text-right">
          {isLoading ? (
            <Skeleton className="ml-auto h-6 w-24" />
          ) : (
            <p className="text-lg font-medium tracking-tight tabular-nums">
              {isError ? '—' : formatNaira(weekTotal)}
            </p>
          )}
          <p className="text-muted-foreground text-xs">Total</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-44 w-full" />
        ) : isError ? (
          <div
            role="alert"
            className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center"
          >
            <p className="text-sm font-medium">Couldn't load the sales overview</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <TimeSeriesChart
              data={points}
              xKey="date"
              series={[{ key: 'total', label: 'Sales' }]}
              type="bar"
              highlight="max"
              xTickFormatter={(value) => formatDateKey(String(value))}
              valueFormatter={formatNaira}
              yTickFormatter={formatNairaCompact}
              ariaLabel={ariaLabel}
              emptyState={<p>No sales in the last 7 days</p>}
            />

            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
              <span>
                Best day: <span className="text-foreground font-medium">{bestLabel}</span>
              </span>
              <span>
                Average day:{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {formatNaira(average)}
                </span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
