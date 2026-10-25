import { useNavigate } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview"
        actions={
          <Button onClick={() => logout(navigate)} variant={'outline'}>
            Back to login
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
