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

import { useGetCurrentShift } from '@/features/shifts/hooks/useShiftQueries';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';
import { useGetCurrentStore } from '@/features/admin/hooks/useAdminQueries';
import { EndShiftDialog } from '@/features/shifts/components/end-shift-dialog';

import type { MyProfile } from '@/features/auth/interface';
import type { Shift } from '@/features/shifts/types';

type ShiftActionProps = {
  loading: boolean;
  profile: MyProfile;
  shift: Shift;
  onStart: () => void;
  onEnd: () => void;
};

function ShiftAction({ loading, profile, shift, onStart, onEnd }: ShiftActionProps) {
  if (loading) return <Skeleton className="h-10 w-72" />;
  if (!profile || profile.role === 'admin') return null;

  if (profile.active_shift_id) {
    return shift ? (
      <ShiftStatus shift={shift} onEndShift={onEnd} principal={profile} />
    ) : (
      <Skeleton className="h-10 w-36" />
    );
  }

  return (
    <Button variant="secondary" onClick={onStart}>
      <Sparkles />
      Start Shift
    </Button>
  );
}

export function DashboardPage() {
  const [startShiftOpen, setStartShiftOpen] = useState(false);
  const [endShiftOpen, setEndShiftOpen] = useState(false);

  const { data: store, isLoading: storeLoading } = useGetCurrentStore();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data, isLoading } = useGetCurrentShift(profile?.id ?? '');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          storeLoading ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            `${store?.name ? `${store.name} ` : ''}Dashboard`
          )
        }
        description="Sales, stock, and shift overview for today."
        actions={
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:justify-end">
            {isLoading || profileLoading || storeLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : profile?.role !== 'admin' && profile?.active_shift_id && data ? (
              <ShiftAction
                loading={isLoading || profileLoading}
                profile={profile}
                shift={data}
                onStart={() => setStartShiftOpen(true)}
                onEnd={() => setEndShiftOpen(true)}
              />
            ) : profile && profile.role !== 'admin' && !profile?.active_shift_id ? (
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

      {profile && (
        <StartShiftDialog
          open={startShiftOpen}
          onOpenChange={setStartShiftOpen}
          profile={profile}
          isLoading={isLoading}
          store={store?.name ?? 'Main Store'}
        />
      )}

      <EndShiftDialog
        open={endShiftOpen}
        onOpenChange={setEndShiftOpen}
        shift={data ?? null}
        isLoading={isLoading}
      />
    </div>
  );
}
