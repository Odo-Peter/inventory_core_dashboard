import { useCallback, useEffect, useState } from 'react';
import { listAuditLogs } from '../mock/audit-api';
import type { AuditEvent, AuditFilters } from '../types';

export function useAuditLogs(filters: AuditFilters) {
  const [data, setData] = useState<AuditEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listAuditLogs(filters);
      setData(result.data);
      setNextCursor(result.next_cursor);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const result = await listAuditLogs(filters, nextCursor);
      setData((prev) => [...prev, ...result.data]);
      setNextCursor(result.next_cursor);
    } catch (err) {
      setError(err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [filters, nextCursor, isFetchingMore]);

  const refetch = useCallback(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  return {
    data,
    isLoading,
    isFetchingMore,
    error,
    nextCursor,
    hasMore: !!nextCursor,
    fetchMore,
    refetch,
  };
}
