import { PlaceholderPage } from '@/features/placeholders/pages/placeholder-page';

export function SalesRoute() {
  return (
    <PlaceholderPage
      title="Sales History"
      description="Review completed and pending sales."
      emptyTitle="No sales recorded"
      emptyDescription="Completed sales will appear here."
    />
  );
}
