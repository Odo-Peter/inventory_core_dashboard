import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/form/input';
import { Spinner } from '@/components/ui/spinner';

import { adminPinSchema, type AdminPinValues } from '../../schemas/admin-pin.schema';
import { useUnlockStaff } from '../../hooks/useAdminMutations';

import type { Staff } from '../types';

interface UnlockStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onUnlock: () => void;
}

export function UnlockStaffDialog({ open, onOpenChange, staff, onUnlock }: UnlockStaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Unlock <b className="text-primary">{staff?.name ?? 'this staff member'}'s</b> account
          </DialogTitle>
          <DialogDescription>
            This unlocks <b className="text-primary">{staff?.name ?? 'this staff member'}</b>'s
            account so they can sign in again. Their existing PIN stays the same. Enter your own PIN
            to confirm.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the field is empty every time */}
        {open && staff && (
          <UnlockStaffForm
            key={staff.id}
            staff={staff}
            onCancel={() => onOpenChange(false)}
            onDone={() => {
              onOpenChange(false);
              onUnlock();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface UnlockStaffProps {
  staff: Staff;
  onCancel: () => void;
  onDone: () => void;
}

function UnlockStaffForm({ staff, onCancel, onDone }: UnlockStaffProps) {
  const unlockAccount = useUnlockStaff();

  const form = useForm<AdminPinValues>({
    resolver: zodResolver(adminPinSchema),
    defaultValues: { acting_pin: '' },
  });

  const error = form.formState.errors.acting_pin;
  const isPending = unlockAccount.isPending;

  async function onSubmit(values: AdminPinValues) {
    const payload = {
      acting_pin: values.acting_pin,
    };
    try {
      const response = await unlockAccount.mutateAsync({
        id: staff.id,
        payload,
      });
      onDone();

      toast.success(`${response.name} account has been unclocked`);
    } catch (err) {
      // Most likely a wrong admin PIN: show it on the field, not a toast
      form.setError('acting_pin', {
        message: err instanceof Error ? err.message : 'Could not reset PIN',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="acting_pin"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  htmlFor="reset-pin-admin-pin"
                  label="Your PIN"
                  placeholder="******"
                  isPassword
                  inputMode="numeric"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  error={!!error}
                  errorText={error?.message}
                  // onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Unlocking...
              </span>
            ) : (
              'Unlock Account'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
