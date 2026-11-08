import { createColumnHelper } from '@tanstack/react-table';
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableFeatures } from '@/components/shared/data-table';

import type { PosAccount } from '../types';
import { formatStaffDate, formatStaffDateTime } from '@/features/admin/staff/utils';

export interface PosAccountColumnActions {
  onView: (account: PosAccount) => void;
  onEdit: (account: PosAccount) => void;
  onDeactivate: (account: PosAccount) => void;
}

export interface PosAccountColumnPermissions {
  edit: boolean;
  deactivate: boolean;
}

const ALL_POS_PERMISSIONS: PosAccountColumnPermissions = {
  edit: true,
  deactivate: true,
};

const columnHelper = createColumnHelper<DataTableFeatures, PosAccount>();

function PosAccountRowActions({
  account,
  actions,
  permissions,
}: {
  account: PosAccount;
  actions: PosAccountColumnActions;
  permissions: PosAccountColumnPermissions;
}) {
  const { onView, onEdit, onDeactivate } = actions;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${account.label}`}
            className="text-muted-foreground"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44!">
        <DropdownMenuItem onClick={() => onView(account)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        {permissions.edit ? (
          <DropdownMenuItem onClick={() => onEdit(account)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        ) : null}
        {permissions.deactivate && account.active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(account)}>
              <Trash2Icon />
              Deactivate
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const getPosAccountColumns = (
  actions: PosAccountColumnActions,
  permissions: PosAccountColumnPermissions = ALL_POS_PERMISSIONS,
) =>
  columnHelper.columns([
    columnHelper.accessor('label', {
      header: 'Label',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{account.label}</span>
            <span className="text-muted-foreground font-mono text-[11px]">
              {account.id.slice(0, 8)}…
            </span>
          </div>
        );
      },
    }),

    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <Badge variant="outline" className="capitalize">
          {info.getValue().replace(/_/g, ' ')}
        </Badge>
      ),
    }),

    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'success' : 'inactive'}>
          {row.original.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),

    columnHelper.accessor('updated_at', {
      header: 'Updated',
      cell: (info) => (
        <time
          dateTime={info.getValue()}
          title={formatStaffDateTime(info.getValue())}
          className="text-muted-foreground text-xs"
        >
          {formatStaffDate(info.getValue())}
        </time>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <PosAccountRowActions
            account={row.original}
            actions={actions}
            permissions={permissions}
          />
        </div>
      ),
    }),
  ]);
