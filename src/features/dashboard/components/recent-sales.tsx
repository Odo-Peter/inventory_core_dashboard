import { Link } from 'react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { recentSales } from '@/features/dashboard/data/dashboard-data';

export function RecentSales() {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">Recent sales</CardTitle>
          <CardDescription className="text-xs">Latest transactions this shift</CardDescription>
        </div>
        <Link
          to="/sales"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-border divide-y border-t">
          {recentSales.map((sale) => (
            <li key={sale.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                {sale.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{sale.customer}</p>
                <p className="text-muted-foreground text-xs">
                  {sale.method} · {sale.time}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">{sale.amount}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
