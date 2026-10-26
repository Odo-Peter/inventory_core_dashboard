import { Link } from 'react-router';
import { PlusIcon, Sparkles, UserGroup } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { RecentSales } from '@/features/dashboard/components/recent-sales';
import { SalesOverviewChart } from '@/features/dashboard/components/sales-overview-chart';

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Sales, stock, and shift overview for today."
        actions={
          <div className="flex items-center gap-x-2">
            <Link to="/admin/staff" className={buttonVariants({ variant: 'secondary' })}>
              <Sparkles />
              Start Shift
            </Link>
            <Link to="/sales/new" className={buttonVariants()}>
              <PlusIcon />
              Add New Sale
            </Link>
            <Link to="/sales/new" className={buttonVariants()}>
              <UserGroup />
              Add New Staff
            </Link>
          </div>
        }
      />

      <MetricCards />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <SalesOverviewChart />
        <RecentSales />
      </div>
    </div>
  );
}
