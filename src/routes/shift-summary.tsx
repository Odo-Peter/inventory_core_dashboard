import { PlaceholderPage } from '@/features/placeholders/pages/placeholder-page';

export function ShiftSummaryRoute() {
  return (
    <PlaceholderPage
      title="Shift Summary"
      description="Review the current shift."
      emptyTitle="No shift data"
      emptyDescription="Shift totals and staff activity will appear here."
    />
  );
}
