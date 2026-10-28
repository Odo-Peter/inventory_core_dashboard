import { createColumnHelper } from '@tanstack/react-table';
import {
  EyeIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UnlockIcon,
  UserCheck,
} from 'lucide-react';

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

import { StaffAvatar } from './staff-avatar';
import { StaffRoleBadge, StaffStatusBadges } from './staff-badges';
import { formatStaffDate, formatStaffDateTime } from '../utils';
import type { Staff } from '../types';

export interface StaffColumnActions {
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onResetPin: (staff: Staff) => void;
  onDeactivate: (staff: Staff) => void;
  onReactivate: (staff: Staff) => void;
  onUnlock: (staff: Staff) => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, Staff>();

function StaffRowActions({ staff, actions }: { staff: Staff; actions: StaffColumnActions }) {
  const { onView, onEdit, onResetPin, onDeactivate, onReactivate, onUnlock } = actions;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${staff.name}`}
            className="text-muted-foreground"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44!">
        <DropdownMenuItem onClick={() => onView(staff)}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(staff)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPin(staff)}>
          <KeyRoundIcon />
          Reset PIN
        </DropdownMenuItem>
        {staff.is_locked && (
          <DropdownMenuItem onClick={() => onUnlock(staff)}>
            <UnlockIcon />
            Unlock Account
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {staff.active ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(staff)}>
            <Trash2Icon />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="success" onClick={() => onReactivate(staff)}>
            <UserCheck />
            Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const getStaffColumns = (actions: StaffColumnActions) =>
  columnHelper.columns([
    columnHelper.display({
      id: 'staff',
      header: 'Staff',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <StaffAvatar firstName={member.first_name} lastName={member.last_name} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{member.name}</span>
                {member.must_change_pin ? (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground h-4 gap-1 px-1.5 text-[10px]"
                    title="PIN change required"
                  >
                    <KeyRoundIcon className="size-2" />
                    PIN
                  </Badge>
                ) : null}
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">
                {member.staff_code}
              </span>
            </div>
          </div>
        );
      },
    }),

    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => <span className="text-muted-foreground text-xs">{info.getValue()}</span>,
    }),

    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => <StaffRoleBadge role={info.getValue()} />,
    }),

    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StaffStatusBadges active={row.original.active} isLocked={row.original.is_locked} />
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
          <StaffRowActions staff={row.original} actions={actions} />
        </div>
      ),
    }),
  ]);
