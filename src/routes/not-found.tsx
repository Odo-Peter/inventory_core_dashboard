import { NotFoundState } from '@/components/states/not-found';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

export function NotFoundRoute() {
  const navigate = useNavigate();
  return (
    <NotFoundState
      title="Not found"
      description="This page doesn't exist."
      primaryAction={<Button onClick={() => navigate('/')}>Back to dashboard</Button>}
      secondaryAction={
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      }
    />
  );
}
