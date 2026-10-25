import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldError } from '@/components/states/validation';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <CardHeader className="justify-items-center text-center">
            <img src="/logo.svg" alt="" aria-hidden="true" className="mb-1 size-8" />
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>Enter your PIN to start your shift.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="PIN" htmlFor="pin" required>
                <InputGroup className="h-10">
                  <InputGroupInput
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    placeholder="••••"
                    value={pin}
                    onChange={handleChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'pin-error' : undefined}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                      aria-pressed={showPin}
                      onClick={() => setShowPin((visible) => !visible)}
                    >
                      {showPin ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
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
