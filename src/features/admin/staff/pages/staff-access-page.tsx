import { useState } from 'react';
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

type FormMode = 'add' | 'edit';

export function StaffAccessPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffInfo | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    staff: Staff;
    action: ConfirmAction;
  } | null>(null);

  const { data, isLoading } = useListStaff();
  const deactivateStaff = useDeactivateStaff();
  const reactivateStaff = useReactivateStaff();

  const requestDeactivate = (member: Staff) =>
    setConfirmTarget({ staff: member, action: 'deactivate' });
  const requestReactivate = (member: Staff) =>
    setConfirmTarget({ staff: member, action: 'reactivate' });

  const openAddStaff = () => {
    setFormMode('add');
    setSelectedStaff(null);
    setFormOpen(true);
  };

  const openEditStaff = (member: Staff) => {
    setFormMode('edit');
    setSelectedStaff(member);
    setFormOpen(true);
  };

  const openStaffDetails = (member: Staff) => {
    setSelectedStaff(member);
    setDetailsOpen(true);
  };

  const resetPin = (member: Staff) => {
    toast.info('PIN reset is a placeholder', {
      description: `No changes were made to ${member.name}.`,
    });
  };

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
              : 'Staff member removed',
          )
        }
      />
      <StaffTable
        staff={data ?? []}
        onView={openStaffDetails}
        onEdit={openEditStaff}
        onResetPin={resetPin}
        onDeactivate={requestDeactivate}
        onReactivate={requestReactivate}
        isLoading={isLoading}
      />

      <StaffFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        staff={selectedStaff}
        onCreated={setCreatedStaff}
      />

      <CreatedStaffDialog
        open={!!createdStaff}
        onClose={() => setCreatedStaff(null)}
        staff={createdStaff}
      />

      <StaffDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} staff={selectedStaff} />
    </div>
  );
}
