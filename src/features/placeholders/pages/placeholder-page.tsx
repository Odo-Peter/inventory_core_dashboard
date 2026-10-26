import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/states';

interface PlaceholderPageProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function PlaceholderPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} className="bg-card max-w-2xl" />
    </div>
  );
}
