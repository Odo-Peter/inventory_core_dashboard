import { useForm } from 'react-hook-form';
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
import { useResetStaffPin } from '../../hooks/useAdminMutations';

import type { CreatedStaffInfo } from './created-staff-dialog';
import type { Staff } from '../types';

interface ResetPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onReset: (result: CreatedStaffInfo) => void;
}

export function ResetPinDialog({ open, onOpenChange, staff, onReset }: ResetPinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Reset PIN</DialogTitle>
          <DialogDescription>
            This replaces the PIN for{' '}
            <b className="text-primary">{staff?.name ?? 'this staff member'}</b> with a new
            temporary PIN. They will be asked to change it the next time they sign in. Enter your
            own PIN to confirm.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the field is empty every time */}
        {open && staff && (
          <ResetPinForm
            key={staff.id}
            staff={staff}
            onCancel={() => onOpenChange(false)}
            onDone={(result) => {
              onOpenChange(false);
              onReset(result);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ResetPinFormProps {
  staff: Staff;
  onCancel: () => void;
  onDone: (result: CreatedStaffInfo) => void;
}

function ResetPinForm({ staff, onCancel, onDone }: ResetPinFormProps) {
  const resetPin = useResetStaffPin();

  const form = useForm<AdminPinValues>({
    resolver: zodResolver(adminPinSchema),
    defaultValues: { acting_pin: '' },
  });

  const error = form.formState.errors.acting_pin;
  const isPending = resetPin.isPending;

  async function onSubmit(values: AdminPinValues) {
    const payload = {
      acting_pin: values.acting_pin,
    };
    try {
      const response = await resetPin.mutateAsync({
        id: staff.id,
        payload,
      });

      onDone({
        name: response.staff.name,
        staff_code: response.staff.staff_code,
        temporary_pin: response.temporary_pin,
      });
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
                Resetting...
              </span>
            ) : (
              'Reset PIN'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
