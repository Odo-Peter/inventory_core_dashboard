import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/form/input';
import {
  changePinFormSchema,
  type ChangePinFormInput,
  type ChangePinValues,
} from '../schemas/change-pin.schema';

import { useChangePin } from '../hooks/useAuthMutation';
import { TOKEN_STORAGE_KEY } from '@/lib/token';

interface ChangePinDialogProps {
  open: boolean;
  onSuccess: () => void;
}

export function ChangePinDialog({ open, onSuccess }: ChangePinDialogProps) {
  const { mutateAsync, isPending } = useChangePin();

  const form = useForm<ChangePinFormInput, unknown, ChangePinValues>({
    resolver: zodResolver(changePinFormSchema),
    defaultValues: {
      temporaryPin: '',
      newPin: '',
      confirmPin: '',
    },
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: ChangePinValues) {
    const payload = {
      current_pin: values.temporaryPin,
      new_pin: values.newPin,
    };

    try {
      const response = await mutateAsync(payload);
      if (response?.access_token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      }
      toast.success('PIN updated successfully');
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update PIN');
    }
  }
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Change your PIN</DialogTitle>
          <DialogDescription>
            You must replace the temporary PIN before continuing to use the dashboard.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col space-y-6">
            <div className="flex w-full flex-col gap-y-4">
              <FormField
                control={form.control}
                name="temporaryPin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        htmlFor="temporary-pin"
                        label="Temporary PIN"
                        placeholder="*******"
                        isPassword
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                        error={!!errors.temporaryPin}
                        errorText={errors.temporaryPin?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        htmlFor="new-pin"
                        label="New PIN"
                        placeholder="*******"
                        isPassword
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="new-password"
                        required
                        error={!!errors.newPin}
                        errorText={errors.newPin?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        htmlFor="confirm-pin"
                        label="Confirm new PIN"
                        placeholder="*******"
                        isPassword
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="new-password"
                        required
                        error={!!errors.confirmPin}
                        errorText={errors.confirmPin?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-3.5 w-3.5" />
                    Updating PIN...
                  </span>
                ) : (
                  'Update PIN'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
