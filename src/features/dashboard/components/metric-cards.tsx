import type { ReactNode } from 'react';
import { Link } from 'react-router';

import {
  BanknoteIcon,
  CalculatorIcon,
  ReceiptTextIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useListItems } from '@/features/inventory/category/hooks/useCategoryQueries';
import { formatNaira } from '@/features/admin/staff/utils';
import { useCan } from '@/lib/rbac';

import { useSalesOverview } from '../hooks/useDashboardQueries';
import type { PaymentMethod, SalesOverviewToday } from '@/features/sales/types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Transfer',
};

interface MetricCardFrameProps {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}

function MetricCardFrame({ label, icon: Icon, children }: MetricCardFrameProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <span className="bg-muted text-muted-foreground flex size-7.5 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-3.5" />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">{children}</div>
      </CardContent>
    </Card>
  );
}

function MetricValue({ children }: { children: ReactNode }) {
  return <p className="text-2xl font-extrabold tracking-tight tabular-nums">{children}</p>;
}

function MetricDetail({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-xs">{children}</p>;
}

function MetricSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-32" />
    </>
  );
}

function MetricError({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <p className="text-muted-foreground text-xs">Couldn't load this metric.</p>
      <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={onRetry}>
        Retry
      </Button>
    </>
  );
}

function paymentSplit(today: SalesOverviewToday) {
  return today.by_method
    .map((entry) => `${METHOD_LABELS[entry.method] ?? entry.method} ${entry.count}`)
    .join(' · ');
}

function SalesTodayCard() {
  const { data, isLoading, isError, refetch } = useSalesOverview();
  const label = data?.scope === 'own' ? 'Your sales today' : 'Sales today';
  const daily = data?.daily ?? [];
  const weekTotal = daily.reduce((sum, day) => sum + day.total, 0);
  const average = Math.round(weekTotal / Math.max(daily.length, 1));

  return (
    <MetricCardFrame label={label} icon={BanknoteIcon}>
      {isLoading ? (
        <MetricSkeleton />
      ) : isError || !data ? (
        <MetricError onRetry={() => refetch()} />
      ) : (
        <>
          <MetricValue>{formatNaira(data.today.total)}</MetricValue>
          <MetricDetail>7-day average {formatNaira(average)}</MetricDetail>
        </>
      )}
    </MetricCardFrame>
  );
}

function TransactionsCard() {
  const { data, isLoading, isError, refetch } = useSalesOverview();

  return (
    <MetricCardFrame label="Transactions" icon={ReceiptTextIcon}>
      {isLoading ? (
        <MetricSkeleton />
      ) : isError || !data ? (
        <MetricError onRetry={() => refetch()} />
      ) : (
        <>
          <MetricValue>{data.today.count.toLocaleString()}</MetricValue>
          <MetricDetail>{paymentSplit(data.today) || 'No payments recorded today'}</MetricDetail>
        </>
      )}
    </MetricCardFrame>
  );
}

function AverageSaleCard() {
  const { data, isLoading, isError, refetch } = useSalesOverview();

  return (
    <MetricCardFrame label="Average sale" icon={CalculatorIcon}>
      {isLoading ? (
        <MetricSkeleton />
      ) : isError || !data ? (
        <MetricError onRetry={() => refetch()} />
      ) : (
        <>
          <MetricValue>
            {data.today.count === 0
              ? 'n/a'
              : formatNaira(Math.round(data.today.total / data.today.count))}
          </MetricValue>
          <MetricDetail>
            {data.today.count === 0
              ? 'No sales today'
              : `Across ${data.today.count.toLocaleString()} transactions`}
          </MetricDetail>
        </>
      )}
    </MetricCardFrame>
  );
}

function LowStockCard() {
  const { data, isLoading, isError, refetch } = useListItems({
    page: 1,
    page_size: 1,
    low_stock: true,
  });
  const total = data?.meta.total ?? 0;

  return (
    <Link
      to="/inventory?low_stock=true"
      className="focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
      aria-label="View low stock items"
    >
      <MetricCardFrame label="Low stock items" icon={TriangleAlertIcon}>
        {isLoading ? (
          <MetricSkeleton />
        ) : isError ? (
          <MetricError onRetry={() => refetch()} />
        ) : (
          <>
            <MetricValue>{total.toLocaleString()}</MetricValue>
            <MetricDetail>At or below reorder threshold</MetricDetail>
          </>
        )}
      </MetricCardFrame>
    </Link>
  );
}

export function MetricCards() {
  const canViewSales = useCan('salesOverview');
  const canViewItems = useCan('inventoryView');

  if (!canViewSales && !canViewItems) return null;

  return (
    <section aria-label="Today's overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {canViewSales ? (
        <>
          <SalesTodayCard />
          <TransactionsCard />
          <AverageSaleCard />
        </>
      ) : null}
      {canViewItems ? <LowStockCard /> : null}
    </section>
  );
}
