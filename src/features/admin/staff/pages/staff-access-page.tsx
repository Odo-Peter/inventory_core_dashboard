import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';

import { StaffDetailsDrawer } from '../components/staff-details-drawer';
import { StaffFormDrawer } from '../components/staff-form-drawer';
import { StaffTable } from '../components/staff-table';
import { MOCK_STORE_ID, mockStaff } from '../mock-data';
import type { StaffFormValues } from '../schemas/staff-form.schema';
import type { Staff } from '../types';

type FormMode = 'add' | 'edit';

export function StaffAccessPage() {
  const [staff, setStaff] = useState<Staff[]>(mockStaff);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const saveStaff = (values: StaffFormValues) => {
    const now = new Date().toISOString();
    const name = `${values.first_name} ${values.last_name}`.trim();

    if (formMode === 'edit' && selectedStaff) {
      setStaff((current) =>
        current.map((member) =>
          member.id === selectedStaff.id
            ? {
                ...member,
                ...values,
                name,
                updated_at: now,
              }
            : member,
        ),
      );
      setSelectedStaff((current) =>
        current ? { ...current, ...values, name, updated_at: now } : current,
      );
      toast.success('Staff member updated');
      return;
    }

    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      store_id: MOCK_STORE_ID,
      ...values,
      name,
      active: true,
      must_change_pin: true,
      is_locked: false,
      created_at: now,
      updated_at: now,
    };

    setStaff((current) => [newStaff, ...current]);
    toast.success('Staff member added');
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
        staff={staff}
        onView={openStaffDetails}
        onEdit={openEditStaff}
        onResetPin={resetPin}
        onDelete={deleteStaff}
      />

      <StaffFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        staff={selectedStaff}
        onSubmit={saveStaff}
      />

      <StaffDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} staff={selectedStaff} />
    </div>
  );
}
