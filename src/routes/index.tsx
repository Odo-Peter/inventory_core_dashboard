import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

export function IndexRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview"
        actions={<Button>View reports</Button>}
      />
      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-sm">Dashboard placeholder</p>
        <p className="text-muted-foreground text-xs">Quiet Utility shell ready.</p>
      </div>
    </div>
  );
}
