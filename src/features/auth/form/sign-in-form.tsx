import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { signInFormSchema, type SignInFormInput, type SignInValues } from './sign-in-form.schema';
import { Input } from '@/components/ui/form/input';
import { TOKEN_STORAGE_KEY } from '@/lib/token';

import { useLogin } from '../hooks/useAuthMutation';

const SignInForm = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useLogin();

  const form = useForm<SignInFormInput, unknown, SignInValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      code: '',
      pin: '',
    },
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: SignInValues) {
    const payload = {
      staff_code: values.code,
      pin: values.pin,
    };

    try {
      const response = await mutateAsync(payload);
      if (response.access_token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
        toast.success('Signed in successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col space-y-6">
        <div className="flex w-full flex-col gap-y-6">
          {/* Staff Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="staff-code"
                    label="Staff Code"
                    placeholder="Enter staff code"
                    required
                    error={!!errors.code}
                    errorText={errors.code?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* PIN */}
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="pin"
                    label="PIN"
                    placeholder="*******"
                    isPassword
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    error={!!errors.pin}
                    errorText={errors.pin?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;
