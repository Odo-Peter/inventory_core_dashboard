import { useCallback, useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';

import { StaffDetailsDrawer } from '../components/staff-details-drawer';
import { StaffFormDrawer } from '../components/staff-form-drawer';
import { StaffTable } from '../components/staff-table';
import { ConfirmActionDialog, type ConfirmAction } from '@/components/shared/confirm-action-dialog';
import { CreatedStaffDialog, type CreatedStaffInfo } from '../components/created-staff-dialog';

import type { Staff } from '../types';

import { useListStaff } from '../../hooks/useAdminQueries';
import { useDeactivateStaff, useReactivateStaff } from '../../hooks/useAdminMutations';
import { ResetPinDialog } from '../components/reset-pin-dialog';
import { UnlockStaffDialog } from '../components/unlock-staff-dialog';
import { getStaffColumns } from '../components/staff-columns';

type FormMode = 'add' | 'edit';

export function StaffAccessPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffInfo | null>(null);
  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Staff | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    staff: Staff;
    action: ConfirmAction;
  } | null>(null);

  const [createdVariant, setCreatedVariant] = useState<'created' | 'reset'>('created');

  const { data, isLoading } = useListStaff();
  const deactivateStaff = useDeactivateStaff();
  const reactivateStaff = useReactivateStaff();

  // Stable handlers, so the columns are only built once
  const requestDeactivate = useCallback(
    (member: Staff) => setConfirmTarget({ staff: member, action: 'deactivate' }),
    [],
  );
  const requestReactivate = useCallback(
    (member: Staff) => setConfirmTarget({ staff: member, action: 'reactivate' }),
    [],
  );
  const resetPin = useCallback((member: Staff) => setResetTarget(member), []);
  const unlockAccount = useCallback((member: Staff) => setUnlockTarget(member), []);

  const openEditStaff = useCallback((member: Staff) => {
    setFormMode('edit');
    setSelectedStaff(member);
    setFormOpen(true);
  }, []);

  const openStaffDetails = useCallback((member: Staff) => {
    setSelectedStaff(member);
    setDetailsOpen(true);
  }, []);

  const openAddStaff = () => {
    setFormMode('add');
    setSelectedStaff(null);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      getStaffColumns({
        onView: openStaffDetails,
        onEdit: openEditStaff,
        onResetPin: resetPin,
        onDeactivate: requestDeactivate,
        onReactivate: requestReactivate,
        onUnlock: unlockAccount,
      }),
    [
      openStaffDetails,
      openEditStaff,
      resetPin,
      requestDeactivate,
      requestReactivate,
      unlockAccount,
    ],
  );

  const staff = useMemo(() => data ?? [], [data]);
  const activeCount = staff.filter((member) => member.active).length;
  const lockedCount = staff.filter((member) => member.is_locked).length;

  const description =
    `${staff.length} ${staff.length === 1 ? 'member' : 'members'} · ${activeCount} active` +
    (lockedCount > 0 ? ` · ${lockedCount} locked` : '');

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Staff & Access"
        description="Manage staff accounts, roles, and access."
        actions={
          <Button onClick={openAddStaff}>
            <PlusIcon data-icon="inline-start" />
            Add Staff
          </Button>
        }
      />

      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        action={confirmTarget?.action}
        entityId={confirmTarget?.staff.id ?? null}
        entityName={confirmTarget?.staff.name}
        entityLabel="staff member"
        onConfirm={(id) =>
          confirmTarget?.action === 'reactivate'
            ? reactivateStaff.mutateAsync(id)
            : deactivateStaff.mutateAsync(id)
        }
        onSuccess={() =>
          toast.success(
            confirmTarget?.action === 'reactivate'
              ? 'Staff member reactivated'
              : 'Staff member deactivated',
          )
        }
      />

      <StaffTable columns={columns} staff={staff} description={description} isLoading={isLoading} />

      <StaffFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        staff={selectedStaff}
        onCreated={(info) => {
          setCreatedVariant('created');
          setCreatedStaff(info);
        }}
      />

      <ResetPinDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        staff={resetTarget}
        onReset={(info) => {
          setCreatedVariant('reset');
          setCreatedStaff(info);
        }}
      />

      <UnlockStaffDialog
        open={!!unlockTarget}
        onOpenChange={(open) => !open && setUnlockTarget(null)}
        staff={unlockTarget}
        onUnlock={() => setUnlockTarget(null)}
      />

      <CreatedStaffDialog
        open={!!createdStaff}
        onClose={() => setCreatedStaff(null)}
        staff={createdStaff}
        variant={createdVariant}
      />

      <StaffDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} staff={selectedStaff} />
    </div>
  );
}
