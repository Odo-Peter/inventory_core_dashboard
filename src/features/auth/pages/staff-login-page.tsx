import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignInForm from '../form/sign-in-form';

export function StaffLoginPage() {
  return (
    <div className="bg-background text-foreground flex min-h-[calc(100vh-3rem)] w-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="justify-items-center text-center">
            <img src="/logo.svg" alt="" aria-hidden="true" className="mb-1 size-8" />
            <CardTitle>
              <h1>Staff Login</h1>
            </CardTitle>
            <CardDescription>Enter your PIN to start your shift.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-3 text-center text-xs">Store: Main</p>
      </div>
    </div>
  );
}
