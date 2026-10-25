import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

export function PosRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="POS" description="Point of sale" actions={<Button>New sale</Button>} />
      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-sm">POS placeholder</p>
      </div>
    </div>
  );
}
