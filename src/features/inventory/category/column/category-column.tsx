import { createColumnHelper } from '@tanstack/react-table';
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, UserCheck } from 'lucide-react';

import type { DataTableFeatures } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatStaffDate } from '@/features/admin/staff/utils';

import type { CategoryResponse } from '../types';

export interface CategoryColumnActions {
  onView: (category: CategoryResponse) => void;
  onEdit: (category: CategoryResponse) => void;
  onDeactivate: (category: CategoryResponse) => void;
  onReactivate: (category: CategoryResponse) => void;
}

export interface CategoryColumnPermissions {
  edit: boolean;
  changeStatus: boolean;
}

const ALL_CATEGORY_PERMISSIONS: CategoryColumnPermissions = {
  edit: true,
  changeStatus: true,
};

const columnHelper = createColumnHelper<DataTableFeatures, CategoryResponse>();

function CategoryRowActions({
  category,
  actions,
  permissions,
}: {
  category: CategoryResponse;
  actions: CategoryColumnActions;
  permissions: CategoryColumnPermissions;
}) {
  const { onView, onEdit, onDeactivate, onReactivate } = actions;
  const hasManagementActions = permissions.edit || permissions.changeStatus;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for category ${category.name}`}
            className="text-muted-foreground"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(category)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>

        {permissions.edit ? (
          <DropdownMenuItem onClick={() => onEdit(category)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        ) : null}

        {hasManagementActions ? <DropdownMenuSeparator /> : null}

        {permissions.changeStatus ? (
          category.active ? (
            <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(category)}>
              <Trash2Icon />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="success" onClick={() => onReactivate(category)}>
              <UserCheck />
              Reactivate
            </DropdownMenuItem>
          )
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const getCategoryColumns = (
  actions: CategoryColumnActions,
  permissions: CategoryColumnPermissions = ALL_CATEGORY_PERMISSIONS,
) =>
  columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'Category',
      cell: (info) => <span className="text-sm font-medium">{info.getValue()}</span>,
    }),

    columnHelper.accessor('active', {
      header: 'Status',
      cell: (info) => {
        const active = info.getValue();

        return (
          <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Active' : 'Inactive'}</Badge>
        );
      },
    }),

    columnHelper.accessor('created_at', {
      header: 'Date created',
      cell: (info) => (
        <time dateTime={info.getValue()} className="text-muted-foreground text-xs tabular-nums">
          {formatStaffDate(info.getValue())}
        </time>
      ),
    }),

    columnHelper.accessor('updated_at', {
      header: 'Last updated',
      cell: (info) => (
        <time dateTime={info.getValue()} className="text-muted-foreground text-xs tabular-nums">
          {formatStaffDate(info.getValue())}
        </time>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right" onClick={(event) => event.stopPropagation()}>
          <CategoryRowActions category={row.original} actions={actions} permissions={permissions} />
        </div>
      ),
    }),
  ]);
