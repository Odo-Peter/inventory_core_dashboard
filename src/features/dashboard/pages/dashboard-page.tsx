import { useState } from 'react';
import { Link } from 'react-router';
import { PlusIcon, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { RecentSales } from '@/features/dashboard/components/recent-sales';
import { SalesOverviewChart } from '@/features/dashboard/components/sales-overview-chart';
import { StartShiftDialog } from '@/features/shifts/components/start-shift-dialog';
import { ShiftStatus } from '@/features/shifts/components/shift-status';
import { useActiveShift } from '@/features/shifts/hooks/use-active-shift';

export function DashboardPage() {
  const [startShiftOpen, setStartShiftOpen] = useState(false);
  const { profile, activeShift, isLoading } = useActiveShift();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Sales, stock, and shift overview for today."
        actions={
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:justify-end">
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : activeShift ? (
              <ShiftStatus shift={activeShift} staffCode={profile?.staff_code} />
            ) : profile ? (
              <Button variant="secondary" onClick={() => setStartShiftOpen(true)}>
                <Sparkles />
                Start Shift
              </Button>
            ) : null}
            <Link to="/sales/new" className={buttonVariants()}>
              <PlusIcon />
              Add New Sale
            </Link>
          </div>
        }
      />

      <MetricCards />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <SalesOverviewChart />
        <RecentSales />
      </div>

      <StartShiftDialog open={startShiftOpen} onOpenChange={setStartShiftOpen} />
    </div>
  );
}
