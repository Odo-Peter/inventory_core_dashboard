import { EyeIcon, KeyRoundIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { StaffAvatar } from './staff-avatar';
import { StaffRoleBadge, StaffStatusBadges } from './staff-badges';
import type { Staff } from '../types';
import { formatStaffDate, formatStaffDateTime } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StaffTableProps {
  staff: Staff[];
  isLoading?: boolean;
  skeletonRows?: number;
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onResetPin: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

interface StaffRowActionsProps extends Pick<
  StaffTableProps,
  'onView' | 'onEdit' | 'onResetPin' | 'onDelete'
> {
  staff: Staff;
}

function StaffTableSkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index} aria-hidden="true">
      {/* Staff: avatar + name + staff code */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </TableCell>
      {/* Phone */}
      <TableCell>
        <Skeleton className="h-3 w-24" />
      </TableCell>
      {/* Role badge */}
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      {/* Status badge */}
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-full" />
      </TableCell>
      {/* Updated */}
      <TableCell>
        <Skeleton className="h-3 w-20" />
      </TableCell>
      {/* Actions */}
      <TableCell className="text-right">
        <Skeleton className="ml-auto size-8 rounded-md" />
      </TableCell>
    </TableRow>
  ));
}

function StaffRowActions({ staff, onView, onEdit, onResetPin, onDelete }: StaffRowActionsProps) {
  return (
    <DropdownMenu>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(staff)}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StaffTable({
  staff,
  onView,
  onEdit,
  onResetPin,
  onDelete,
  isLoading,
  skeletonRows = 5,
}: StaffTableProps) {
  const activeCount = staff.filter((member) => member.active).length;
  const lockedCount = staff.filter((member) => member.is_locked).length;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">All staff</h2>
          <p className="text-muted-foreground text-xs">
            {staff.length} {staff.length === 1 ? 'member' : 'members'} · {activeCount} active
            {lockedCount > 0 ? ` · ${lockedCount} locked` : ''}
          </p>
        </div>
      </div>

      <Table className="[&_td]:px-4 [&_th]:px-4">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Staff
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Phone
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Role
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              Updated
            </TableHead>
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <StaffTableSkeletonRows rows={skeletonRows} />
          ) : staff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                No staff members found.
              </TableCell>
            </TableRow>
          ) : (
            staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{member.phone}</TableCell>
                <TableCell>
                  <StaffRoleBadge role={member.role} />
                </TableCell>
                <TableCell>
                  <StaffStatusBadges active={member.active} isLocked={member.is_locked} />
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  <time dateTime={member.updated_at} title={formatStaffDateTime(member.updated_at)}>
                    {formatStaffDate(member.updated_at)}
                  </time>
                </TableCell>
                <TableCell className="text-right">
                  <StaffRowActions
                    staff={member}
                    onView={onView}
                    onEdit={onEdit}
                    onResetPin={onResetPin}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
