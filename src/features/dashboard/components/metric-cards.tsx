import { Card, CardContent } from '@/components/ui/card';
import { dashboardMetrics } from '@/features/dashboard/data/dashboard-data';

export function MetricCards() {
  return (
    <section aria-label="Today's overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.label} size="sm">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm font-medium">{metric.label}</p>
                <span className="bg-muted text-muted-foreground flex size-7.5 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-3.5" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                  {metric.value}
                </p>
                <p className="text-muted-foreground text-xs">{metric.detail}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
