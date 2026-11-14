import { Link } from 'react-router';

import {
  BanknoteIcon,
  Building2Icon,
  CreditCardIcon,
  ReceiptTextIcon,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNaira, formatTime } from '@/features/admin/staff/utils';
import { useListSales } from '@/features/sales/hooks/useSalesQueries';
import type { PaymentMethod } from '@/features/sales/types';
import { useCan } from '@/lib/rbac';

const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: LucideIcon }> = {
  cash: { label: 'Cash', icon: BanknoteIcon },
  card: { label: 'Card', icon: CreditCardIcon },
  bank_transfer: { label: 'Transfer', icon: Building2Icon },
};

const PAGE_SIZE = 5;

function RecentSalesSkeleton() {
  return (
    <ul className="divide-border divide-y border-t" aria-hidden="true">
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}

export function RecentSales() {
  const canView = useCan('salesHistory');
  const { data, isLoading, isError, refetch } = useListSales({
    page: 1,
    page_size: PAGE_SIZE,
  });

  if (!canView) return null;

  const sales = data?.data ?? [];

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">Recent sales</CardTitle>
          <CardDescription className="text-xs">Latest completed sales</CardDescription>
        </div>
        <Link
          to="/sales"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <RecentSalesSkeleton />
        ) : isError ? (
          <div
            role="alert"
            className="mx-4 flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-6 text-center"
          >
            <p className="text-sm font-medium">Couldn't load recent sales</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : sales.length === 0 ? (
          <p className="text-muted-foreground border-t px-4 py-8 text-center text-sm">
            No sales yet
          </p>
        ) : (
          <ul className="divide-border divide-y border-t">
            {sales.map((sale) => {
              const method = sale.payment_method ? PAYMENT_METHODS[sale.payment_method] : null;
              const Icon = method?.icon ?? ReceiptTextIcon;

              return (
                <li key={sale.id}>
                  <Link
                    to={`/sales?sale_id=${sale.id}`}
                    className="hover:bg-muted/40 flex items-center gap-3 px-4 py-2.5 transition-colors"
                  >
                    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">#{sale.receipt_number}</p>
                      <p className="text-muted-foreground text-xs">
                        {method?.label ?? 'Unknown'} · {formatTime(sale.created_at)}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatNaira(sale.total)}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
