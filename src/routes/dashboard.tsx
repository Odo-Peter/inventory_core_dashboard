import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

export function DashboardRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview"
        actions={
          <Button asChild variant="outline">
            <Link to="/">Back to login</Link>
          </Button>
        }
      />
      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-sm">Dashboard placeholder</p>
        <p className="text-muted-foreground text-xs">Demo navigation from Staff Login.</p>
      </div>
    </div>
  );
}
