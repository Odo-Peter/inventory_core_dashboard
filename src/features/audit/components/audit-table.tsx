import { MoreHorizontalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { StaffAvatar } from '@/features/admin/staff/components/staff-avatar';
import { dateTimeFormatter } from '@/features/admin/staff/utils';

import type { AuditEvent } from '../types';
import { formatAuditAction, truncateId } from '../utils';

interface AuditTableProps {
  events: AuditEvent[];
  isLoading?: boolean;
  skeletonRows?: number;
  onView: (event: AuditEvent) => void;
}

function AuditTableSkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto size-8 rounded-md" />
      </TableCell>
    </TableRow>
  ));
}

export function AuditTable({ events, isLoading, skeletonRows = 10, onView }: AuditTableProps) {
  const countLabel = isLoading
    ? '… events shown'
    : `${events.length} ${events.length === 1 ? 'event' : 'events'} shown`;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">Events</h2>
          <p className="text-muted-foreground text-xs">{countLabel}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                When
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Action
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Actor
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Entity
              </TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AuditTableSkeletonRows rows={skeletonRows} />
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                  No events match these filters
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const createdDate = new Date(event.created_at);
                const localTime = dateTimeFormatter.format(createdDate);
                const actionLabel = formatAuditAction(event.action);

                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <time
                        dateTime={event.created_at}
                        title={event.created_at}
                        className="text-muted-foreground text-xs"
                      >
                        {localTime}
                      </time>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{actionLabel}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {event.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.actor ? (
                        <div className="flex items-center gap-3">
                          <StaffAvatar
                            firstName={event.actor.name.split(' ')[0] || event.actor.name}
                            lastName={event.actor.name.split(' ')[1] || ''}
                          />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="font-medium">{event.actor.name}</span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {event.actor.staff_code}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            title="No signed-in staff member was attached to this event, for example a failed sign-in with an unknown staff code."
                            className="text-muted-foreground text-sm"
                          >
                            System or unknown
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.entity_id ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{event.entity_type || 'Unknown'}</span>
                          <span
                            title={event.entity_id}
                            className="text-muted-foreground font-mono text-[11px]"
                          >
                            {truncateId(event.entity_id)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">n/a</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View details for ${actionLabel} at ${localTime}`}
                        onClick={() => onView(event)}
                        className="text-muted-foreground"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
