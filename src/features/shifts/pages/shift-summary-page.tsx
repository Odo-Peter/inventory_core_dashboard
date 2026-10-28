import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';

import { AdminEndShiftDialog } from '../components/admin-end-shift-dialog';
import { ShiftDetailsDrawer } from '../components/shift-details-drawer';
import { ShiftTable } from '../components/shift-table';
import { useAllShifts } from '../hooks/useShiftQueries';

import type { Shift } from '../types';
import { getShiftColumns, isShiftOpen } from '@/features/admin/staff/columns/shift-column';

const PAGE_SIZE = 25;

export function ShiftSummaryPage() {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminEndOpen, setAdminEndOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '', 10) || 1);

  const { data: profile } = useMyProfile();
  const { data, isLoading, isFetching } = useAllShifts({ page, page_size: PAGE_SIZE });

  const shifts = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const principal = profile ? { id: profile.id, role: profile.role } : null;

  const openCount = useMemo(() => shifts.filter(isShiftOpen).length, [shifts]);
  const total = meta?.total ?? shifts.length;

  const description =
    `${total} ${total === 1 ? 'shift' : 'shifts'}` +
    (shifts.length > 0
      ? ` · ${openCount} open · ${shifts.length - openCount} closed on this page`
      : '');

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (nextPage <= 1) params.delete('page');
        else params.set('page', String(nextPage));
        return params;
      });
    },
    [setSearchParams],
  );

  const openShiftDetails = useCallback((shift: Shift) => {
    setSelectedShift(shift);
    setDetailsOpen(true);
  }, []);

  const columns = useMemo(() => getShiftColumns(openShiftDetails), [openShiftDetails]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Shift Summary"
        description="Clock-in times, cash counts, and notes for recent shifts."
      />

      <ShiftTable
        columns={columns}
        shifts={shifts}
        meta={meta}
        description={description}
        onRowClick={openShiftDetails}
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
