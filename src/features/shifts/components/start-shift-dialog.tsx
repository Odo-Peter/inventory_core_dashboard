import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/form/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/states/validation';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/features/auth/interface';

import {
  startShiftSchema,
  type StartShiftFormInput,
  type StartShiftValues,
} from '../schemas/start-shift.schema';
import { useStartShift } from '../hooks/useShiftMutations';
import { dateTimeFormatter } from '@/features/admin/staff/utils';

const NOTE_LIMIT = 1_000;

interface StartShiftDialogProps {
  open: boolean;
  isLoading: boolean;
  profile: MyProfile;
  store: string;
  onOpenChange: (open: boolean) => void;
}

export function StartShiftDialog({
  open,
  onOpenChange,
  isLoading,
  profile,
  store,
}: StartShiftDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return;
        onOpenChange(nextOpen);
      }}
      modal={false}
    >
      <DialogContent className="sm:max-w-2xl" showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Start your shift</DialogTitle>
          <DialogDescription>
            Confirm your details and the opening cash in the drawer before starting.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <StartShiftForm
            profile={profile}
            isLoading={isLoading}
            store={store}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface StartShiftFormProps {
  profile: MyProfile;
  store: string;
  isLoading: boolean;
  onClose: () => void;
}

function StartShiftForm({ profile, onClose, isLoading, store }: StartShiftFormProps) {
  const { isPending, mutateAsync } = useStartShift(profile.id);

  const form = useForm<StartShiftFormInput, unknown, StartShiftValues>({
    resolver: zodResolver(startShiftSchema),
    defaultValues: {
      opening_float: '',
      opening_notes: '',
    },
  });

  const {
    formState: { errors },
  } = form;

  const notesLength = form.watch('opening_notes')?.length ?? 0;
  const staffCode = profile.staff_code;
  const role = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  async function onSubmit(values: StartShiftValues) {
    const payload = {
      opening_float: values.opening_float,
      opening_notes: values.opening_notes,
    };

    try {
      await mutateAsync(payload);
      toast.success('Shift started');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Shift clock in failed!');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <dl className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <IdentityItem label="Name" value={profile.name} />
          <IdentityItem label="Staff code" value={staffCode} mono />
          <IdentityItem label="Role" value={role} />
          <IdentityItem label="Store" value={store} />
        </dl>

        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Date and time
          </p>
          <p className="mt-1 text-sm font-medium">{dateTimeFormatter.format(new Date())}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            This is the current time, clock-in time will be recorded when you confirm.
          </p>
        </div>

        <FormField
          control={form.control}
          name="opening_float"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  id="opening-float"
                  htmlFor="opening-float"
                  label="Starting cash"
                  placeholder="0.00"
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus
                  required
                  disabled={isPending}
                  helpText="Cash already in the drawer before the shift starts"
                  error={!!errors.opening_float}
                  errorText={errors.opening_float?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="opening_notes"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field label="Opening notes" htmlFor="opening-notes">
                <Textarea
                  {...field}
                  id="opening-notes"
                  value={field.value ?? ''}
                  placeholder="Anything worth noting about the drawer?"
                  rows={3}
                  disabled={isPending || isLoading || isLoading}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={
                    fieldState.error ? 'opening-notes-error' : 'opening-notes-count'
                  }
                  className="min-h-20"
                />
                <div className="flex items-start justify-between gap-3">
                  <FieldError id="opening-notes-error">{fieldState.error?.message}</FieldError>
                  <span
                    id="opening-notes-count"
                    className={cn(
                      'text-muted-foreground ml-auto text-xs tabular-nums',
                      notesLength > NOTE_LIMIT && 'text-destructive',
                    )}
                  >
                    {notesLength}/{NOTE_LIMIT}
                  </span>
                </div>
              </Field>
            </FormItem>
          )}
        />

        <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending || isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || isLoading}>
            {isPending || isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Starting...
              </span>
            ) : (
              'Start shift'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function IdentityItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className={cn('truncate text-sm', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}
