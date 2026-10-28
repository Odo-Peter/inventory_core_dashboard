import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { ShiftDetailsDrawer } from '../components/shift-details-drawer';
import { ShiftTable } from '../components/shit-table';

import type { Shift } from '../types';

import { useAllShifts } from '../hooks/useShiftQueries';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';
import { AdminEndShiftDialog } from '../components/admin-end-shift-dialog';

const PAGE_SIZE = 25;

export function ShiftSummaryPage() {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminEndOpen, setAdminEndOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '', 10) || 1);

  const { data: profile } = useMyProfile();
  const { data, isLoading, isFetching } = useAllShifts({ page, page_size: PAGE_SIZE });

  const shifts = data?.data ?? [];
  const meta = data?.meta;
  const principal = profile ? { id: profile.id, role: profile.role } : null;

  const handlePageChange = (nextPage: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (nextPage <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(nextPage));
      }
      return params;
    });
  };

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

      <ShiftTable
        shifts={shifts}
        meta={meta}
        onView={openShiftDetails}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        isFetching={isFetching}
      />

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
