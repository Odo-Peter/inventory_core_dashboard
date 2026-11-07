import { ArrowRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dateTimeFormatter, formatNaira } from '@/features/admin/staff/utils';
import { cn } from '@/lib/utils';

import { useItemPriceHistory } from '../../category/hooks/useCategoryQueries';
import type { PriceHistoryEntry } from '../types';

function Change({ entry }: { entry: PriceHistoryEntry }) {
  const diff = entry.new_price - entry.old_price;
  const pct = entry.old_price > 0 ? (diff / entry.old_price) * 100 : null;

  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400',
      )}
    >
      {diff > 0 ? '+' : '−'}
      {formatNaira(Math.abs(diff))}
      {pct !== null ? ` (${diff > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%)` : ''}
    </span>
  );
}

export function ItemPriceHistory({ itemId }: { itemId: string }) {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useItemPriceHistory(itemId);

  const entries = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <section aria-labelledby="price-history-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        {total > 0 && <span className="text-muted-foreground text-xs">{total} changes</span>}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>Could not load price history.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-sm">
          No price changes yet. The price has not changed since this item was created.
        </p>
      )}

      {entries.length > 0 && (
        <ol className="border-border ml-1.5 flex flex-col gap-4 border-l pl-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="bg-border absolute top-1.5 -left-5.25 size-2 rounded-full" />
              <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
                <span className="text-muted-foreground">{formatNaira(entry.old_price)}</span>
                <ArrowRightIcon
                  className="text-muted-foreground size-3.5"
                  aria-label="changed to"
                />
                <span>{formatNaira(entry.new_price)}</span>
                <Change entry={entry} />
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                <time dateTime={entry.changed_at}>
                  {dateTimeFormatter.format(new Date(entry.changed_at))}
                </time>
                {entry.changed_by_name ? ` · ${entry.changed_by_name}` : ''}
              </div>
            </li>
          ))}
        </ol>
      )}

      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Show more'}
        </Button>
      )}
    </section>
  );
}
