import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';

import { StaffDetailsDrawer } from '../components/staff-details-drawer';
import { StaffFormDrawer } from '../components/staff-form-drawer';
import { StaffTable } from '../components/staff-table';
import { useListStaff } from '../../hooks/useAdminQueries';
import { CreatedStaffDialog, type CreatedStaffInfo } from '../components/created-staff-dialog';
import type { Staff } from '../types';

type FormMode = 'add' | 'edit';

export function StaffAccessPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formMode, setFormMode] = useState<FormMode>('add');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffInfo | null>(null);

  const { data, isLoading } = useListStaff();

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

  const deleteStaff = (member: Staff) => {
    toast.warning('Delete is not wired up yet', {
      description: `${member.name} was not removed.`,
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

      <StaffTable
        staff={data ?? []}
        onView={openStaffDetails}
        onEdit={openEditStaff}
        onResetPin={resetPin}
        onDelete={deleteStaff}
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
