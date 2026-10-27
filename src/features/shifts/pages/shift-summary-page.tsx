import { useState } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { ShiftDetailsDrawer } from '../components/shift-details-drawer';
import { ShiftTable } from '../components/shit-table';

import type { Shift } from '../types';

import { useAllShifts } from '../hooks/useShiftQueries';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';
import { AdminEndShiftDialog } from '../components/admin-end-shift-dialog';

export function ShiftSummaryPage() {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminEndOpen, setAdminEndOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const { data, isLoading } = useAllShifts({ limit: 50 });

  const shifts = Array.isArray(data) ? data : (data?.data ?? []);
  const principal = profile ? { id: profile.id, role: profile.role } : null;

  const openShiftDetails = (shift: Shift) => {
    setSelectedShift(shift);
    setDetailsOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Shift Summary"
        description="Clock-in times, cash counts, and notes for recent shifts."
      />

      <ShiftTable shifts={shifts} onView={openShiftDetails} isLoading={isLoading} />

      <ShiftDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        shift={selectedShift}
        principal={principal}
        onAdminEndShift={(shift) => {
          setSelectedShift(shift);
          setAdminEndOpen(true);
        }}
      />

      <AdminEndShiftDialog
        open={adminEndOpen}
        onOpenChange={setAdminEndOpen}
        shift={selectedShift}
      />
    </div>
  );
}
