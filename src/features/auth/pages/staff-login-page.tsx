import * as React from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldError } from '@/components/states/validation';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPin(value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError('Enter your PIN to continue.');
      return;
    }

    if (pin.length < 4) {
      setError('Invalid PIN format.');
      return;
    }

    setIsSubmitting(true);
    // Local demo delay only - no real auth
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);

    // Local demo success - navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="bg-background text-foreground flex min-h-[calc(100vh-3rem)] w-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>Enter your PIN to start your shift.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="PIN" htmlFor="pin" required>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  placeholder="••••"
                  value={pin}
                  onChange={handleChange}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'pin-error' : undefined}
                />
                <FieldError id="pin-error">{error}</FieldError>
              </Field>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-3.5 w-3.5" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In & Clock In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-3 text-center text-xs">Store: Main</p>
      </div>
    </div>
  );
}
