import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PermissionDeniedState } from '@/components/states';

import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';

import { AuditTable } from '../components/audit-table';
import { AuditDetailsDrawer } from '../components/audit-details-drawer';
import { AuditFiltersBar } from '../components/audit-filters';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditEvent, AuditFilters } from '../types';

const defaultFilters: AuditFilters = {
  action: 'all',
  entityType: 'all',
  actorId: 'all',
  entityId: '',
  from: '',
  to: '',
};

export function AuditLogsPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading, isFetchingMore, error, hasMore, fetchMore, refetch } =
    useAuditLogs(filters);

  const actorOptions = useMemo(
    () => [
      { value: 'actor-1', label: 'Amara Nwosu (STF-001)' },
      { value: 'actor-2', label: 'Tunde Bakare (STF-002)' },
      { value: 'actor-3', label: 'Ifeoma Okoye (STF-003)' },
    ],
    [],
  );

  const handleView = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleFiltersChange = (next: AuditFilters) => {
    setFilters(next);
  };

  // Admin only gating - reuse existing role gating mechanism
  if (!profileLoading && profile && profile.role !== 'admin') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Audit logs"
          description="A read-only record of important actions in your store, such as staff changes, PIN resets, and shift activity. Entries cannot be edited or deleted."
        />
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audit logs"
        description="A read-only record of important actions in your store, such as staff changes, PIN resets, and shift activity. Entries cannot be edited or deleted."
      />

      <AuditFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        actorOptions={actorOptions}
      />

      {error ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load audit logs</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <AuditTable events={data} isLoading={isLoading} skeletonRows={10} onView={handleView} />

          {isLoading ? null : data.length === 0 ? (
            <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
              <p className="text-sm font-medium">
                {filters.action !== 'all' ||
                filters.entityType !== 'all' ||
                filters.actorId !== 'all' ||
                filters.entityId ||
                filters.from ||
                filters.to
                  ? 'No events match these filters'
                  : 'No audit events yet'}
              </p>
              {(filters.action !== 'all' ||
                filters.entityType !== 'all' ||
                filters.actorId !== 'all' ||
                filters.entityId ||
                filters.from ||
                filters.to) && (
                <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {hasMore ? (
                <Button variant="outline" onClick={fetchMore} disabled={isFetchingMore}>
                  {isFetchingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Loading...
                    </span>
                  ) : (
                    'Load more'
                  )}
                </Button>
              ) : (
                <p className="text-muted-foreground text-xs">End of log</p>
              )}
            </div>
          )}
        </>
      )}

      <AuditDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} event={selectedEvent} />
    </div>
  );
}
