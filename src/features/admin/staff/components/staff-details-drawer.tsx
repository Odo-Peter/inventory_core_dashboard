import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { StaffAvatar } from './staff-avatar';
import { StaffRoleBadge, StaffStatusBadges } from './staff-badges';
import type { Staff } from '../types';
import { formatStaffDateTime } from '../utils';

interface StaffDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: Staff | null;
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function StaffDetailsDrawer({ open, onOpenChange, staff }: StaffDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {staff ? (
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="font-semibold">Staff details</SheetTitle>
            <SheetDescription>
              Profile and access information for this staff member.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <StaffAvatar
                firstName={staff.first_name}
                lastName={staff.last_name}
                size="lg"
                className="size-12 text-base"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-lg font-semibold">{staff.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{staff.staff_code}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <StaffRoleBadge role={staff.role} />
                  <StaffStatusBadges active={staff.active} isLocked={staff.is_locked} />
                </div>
              </div>
            </div>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Profile</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Staff code">
                  <span className="font-mono text-xs">{staff.staff_code}</span>
                </DetailItem>
                <DetailItem label="Phone">{staff.phone}</DetailItem>
                <DetailItem label="First name">{staff.first_name}</DetailItem>
                <DetailItem label="Last name">{staff.last_name}</DetailItem>
                <DetailItem label="Created">{formatStaffDateTime(staff.created_at)}</DetailItem>
                <DetailItem label="Updated">{formatStaffDateTime(staff.updated_at)}</DetailItem>
              </dl>
            </section>

            <section className="rounded-lg border">
              <h3 className="border-b px-3 py-2 text-xs font-medium">Access</h3>
              <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <DetailItem label="Role">
                  <StaffRoleBadge role={staff.role} />
                </DetailItem>
                <DetailItem label="Status">
                  <StaffStatusBadges active={staff.active} isLocked={staff.is_locked} />
                </DetailItem>
                <DetailItem label="PIN">
                  {staff.must_change_pin ? 'Change required' : 'Up to date'}
                </DetailItem>
                <DetailItem label="Account state">
                  {staff.is_locked ? 'Locked' : 'Unlocked'}
                </DetailItem>

                <div className="col-span-full flex flex-col gap-y-3">
                  <DetailItem label="Staff ID">
                    <span className="font-mono text-xs break-all">{staff.id}</span>
                  </DetailItem>
                  <DetailItem label="Store ID">
                    <span className="font-mono text-xs break-all">{staff.store_id}</span>
                  </DetailItem>
                </div>
              </dl>
            </section>
          </div>

          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
