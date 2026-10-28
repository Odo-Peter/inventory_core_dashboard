import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { DataTableFeatures } from '@/components/shared/data-table';
import { StaffAvatar } from '@/features/admin/staff/components/staff-avatar';
import { dateTimeFormatter } from '@/features/admin/staff/utils';

import { formatAuditAction, truncateId } from '../utils';
import type { AuditLog } from '../types';

const columnHelper = createColumnHelper<DataTableFeatures, AuditLog>();

export const getAuditColumns = (onView: (event: AuditLog) => void) =>
  columnHelper.columns([
    columnHelper.accessor('created_at', {
      header: 'When',
      cell: (info) => (
        <time
          dateTime={info.getValue()}
          title={info.getValue()}
          className="text-muted-foreground text-xs"
        >
          {dateTimeFormatter.format(new Date(info.getValue()))}
        </time>
      ),
    }),

    columnHelper.display({
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{formatAuditAction(row.original.action)}</span>
          <span className="text-muted-foreground font-mono text-[11px]">{row.original.action}</span>
        </div>
      ),
    }),

    columnHelper.display({
      id: 'actor',
      header: 'Actor',
      cell: ({ row }) => {
        const actor = row.original.actor;

        if (!actor) {
          return (
            <span
              title="No signed-in staff member was attached to this event, for example a failed sign-in with an unknown staff code."
              className="text-muted-foreground text-sm"
            >
              System or unknown
            </span>
          );
        }

        const [firstName = '', ...rest] = actor.name.split(' ');

        return (
          <div className="flex items-center gap-3">
            <StaffAvatar firstName={firstName} lastName={rest.join(' ')} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{actor.name}</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {actor.staff_code}
              </span>
            </div>
          </div>
        );
      },
    }),

    columnHelper.display({
      id: 'entity',
      header: 'Entity',
      cell: ({ row }) => {
        const { entity_id, entity_type } = row.original;

        if (!entity_id) return <span className="text-muted-foreground text-sm">n/a</span>;

        return (
          <div className="flex flex-col">
            <span className="text-sm">{entity_type || 'Unknown'}</span>
            <span title={entity_id} className="text-muted-foreground font-mono text-[11px]">
              {truncateId(entity_id)}
            </span>
          </div>
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={`View details for ${formatAuditAction(row.original.action)} at ${dateTimeFormatter.format(new Date(row.original.created_at))}`}
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            <MoreHorizontalIcon />
          </Button>
        </div>
      ),
    }),
  ]);
