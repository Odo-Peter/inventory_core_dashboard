import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignInForm from '../form/sign-in-form';
import { ChangePinDialog } from '../components/change-pin-dialog';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';

export function StaffLoginPage() {
  const { mustChangePin, completePinChange } = useAuth();
  const navigate = useNavigate();

  const handlePinChanged = () => {
    completePinChange();
    navigate('/dashboard');
  };

  return (
    <div className="bg-background text-foreground flex min-h-[calc(100vh-3rem)] w-full items-center justify-center px-4">
      <ChangePinDialog open={mustChangePin} onSuccess={handlePinChanged} />
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="justify-items-center text-center">
            <img src="/logo.svg" alt="" aria-hidden="true" className="mb-1 size-8" />
            <CardTitle>
              <h1>Staff Login</h1>
            </CardTitle>
            <CardDescription>Enter your staff code and PIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
