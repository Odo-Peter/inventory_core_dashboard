/**
 * The current store query is shared with the dashboard and new-sale screens.
 * Re-exporting it keeps a single cache entry and role gate.
 */
export { useGetCurrentStore as useSettingsStore } from '@/features/admin/hooks/useAdminQueries';
