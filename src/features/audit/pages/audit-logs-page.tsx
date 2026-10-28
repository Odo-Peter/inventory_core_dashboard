import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { PermissionDeniedState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { useAuditActions, useAudits } from '@/features/admin/hooks/useAdminQueries';
import { useListStaff } from '@/features/admin/hooks/useAdminQueries';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';

import { AuditDetailsDrawer } from '../components/audit-details-drawer';
import { getAuditColumns } from '../components/audit-columns';
import { AuditFiltersBar } from '../components/audit-filters';
import { AuditTable } from '../components/audit-table';
import type { AuditFilters, AuditLog } from '../types';
import { formatAuditAction } from '../utils';
import { FILTER_PARAM, readAuditFilters, toAuditParams } from '../components/filters';

const PAGE_SIZE = 25;
const PAGE_DESCRIPTION =
  'A read-only record of important actions in your store, such as staff changes, PIN resets, and shift activity. Entries cannot be edited or deleted.';

// entity_type is a free string on the backend, extend as new entity types appear
const ENTITY_TYPE_OPTIONS = ['Staff', 'Shift'].map((value) => ({ value, label: value }));

export function AuditLogsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const isAdmin = profile?.role === 'admin';

  // Filters and page live in the URL, so a filtered view is shareable and survives refresh
  const filters = useMemo(() => readAuditFilters(searchParams), [searchParams]);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '', 10) || 1);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const params = useMemo(() => toAuditParams(filters, page, PAGE_SIZE), [filters, page]);

  const { data, isLoading, isFetching, isError, refetch } = useAudits(params);

  const { data: auditActions } = useAuditActions();
  const { data: staff } = useListStaff();

  const events = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const actionOptions = useMemo(
    () => (auditActions ?? []).map((a) => ({ value: a, label: formatAuditAction(a) })),
    [auditActions],
  );
  const actorOptions = useMemo(
    () => (staff ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.staff_code})` })),
    [staff],
  );

  const handleView = useCallback((event: AuditLog) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  }, []);

  const columns = useMemo(() => getAuditColumns(handleView), [handleView]);

  const handleFiltersChange = useCallback(
    (patch: Partial<AuditFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const param = FILTER_PARAM[key as keyof AuditFilters];
            if (value) next.set(param, value);
            else next.delete(param);
          }
          next.delete('page'); // any filter change goes back to page 1
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.values(FILTER_PARAM).forEach((param) => next.delete(param));
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) next.delete('page');
        else next.set('page', String(nextPage));
        return next;
      });
    },
    [setSearchParams],
  );

  // A stale URL like ?page=99 would strand the user on an empty page
  useEffect(() => {
    if (meta && meta.total_pages > 0 && page > meta.total_pages) {
      handlePageChange(meta.total_pages);
    }
  }, [meta, page, handlePageChange]);

  if (!profileLoading && profile && !isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Audit logs" description={PAGE_DESCRIPTION} />
        <PermissionDeniedState
          title="Access denied"
          description="You don't have permission to view this page."
          secondaryAction={
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
          }
        />
      </div>
    );
  }

  const total = meta?.total ?? events.length;
  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'event' : 'events'}${hasActiveFilters ? ' matching filters' : ''}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Audit logs" description={PAGE_DESCRIPTION} />

      <AuditFiltersBar
        filters={filters}
        actionOptions={actionOptions}
        entityTypeOptions={ENTITY_TYPE_OPTIONS}
        actorOptions={actorOptions}
        hasActiveFilters={hasActiveFilters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load audit logs</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <AuditTable
          columns={columns}
          events={events}
          meta={meta}
          description={description}
          onRowClick={handleView}
          onPageChange={handlePageChange}
          isLoading={profileLoading || isLoading}
          isFetching={isFetching}
          emptyState={
            hasActiveFilters ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-muted-foreground text-sm">No events match these filters</span>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      <AuditDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} event={selectedEvent} />
    </div>
  );
}
