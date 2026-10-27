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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/form/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import type { Shift } from '../types';
import { formatTime } from '@/features/admin/staff/utils';
import { FieldError } from '@/components/states';
import {
  adminEndShiftSchema,
  type AdminEndShiftFormInput,
  type AdminEndShiftValues,
} from '../schemas/admin-end-shift.schema';
import { useForceCloseShift } from '@/features/admin/hooks/useAdminMutations';

const NOTE_LIMIT = 1000;

interface AdminEndShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  isLoading?: boolean;
}

export function AdminEndShiftDialog({
  open,
  onOpenChange,
  shift,
  isLoading = false,
}: AdminEndShiftDialogProps) {
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
          <DialogTitle className="text-lg font-semibold">End shift</DialogTitle>
          <DialogDescription>
            Close this open shift on behalf of the staff member. Choose a reason and enter the
            counted cash.
          </DialogDescription>
        </DialogHeader>

        {open && shift ? (
          <AdminEndShiftForm
            shift={shift}
            isLoading={isLoading}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface AdminEndShiftFormProps {
  shift: Shift;
  isLoading: boolean;
  onClose: () => void;
}

function AdminEndShiftForm({ shift, isLoading, onClose }: AdminEndShiftFormProps) {
  const { isPending, mutateAsync } = useForceCloseShift(shift.staff_id);

  const form = useForm<AdminEndShiftFormInput, unknown, AdminEndShiftValues>({
    resolver: zodResolver(adminEndShiftSchema),
    defaultValues: {
      closing_cash_counted: '',
      reason: '',
    },
  });

  const {
    formState: { errors },
  } = form;

  const notesLength = form.watch('reason')?.length ?? 0;

  async function onSubmit(values: AdminEndShiftValues) {
    try {
      await mutateAsync({
        id: shift.id,
        payload: {
          closing_cash_counted: values.closing_cash_counted,
          reason: values.reason,
        },
      });
      toast.success('Shift ended');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to end shift');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Shift started
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums">{formatTime(shift.clock_in_at)}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Clock-out time will be recorded when you confirm.
          </p>
        </div>

        <FormField
          control={form.control}
          name="closing_cash_counted"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  id="closing-cash"
                  htmlFor="closing-cash"
                  label="Closing cash"
                  placeholder="0.00"
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus
                  required
                  disabled={isPending || isLoading}
                  helpText="Total cash counted in the drawer at the end of the shift"
                  error={!!errors.closing_cash_counted}
                  errorText={errors.closing_cash_counted?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field label="Closing notes" htmlFor="closing-notes">
                <Textarea
                  {...field}
                  id="closing-notes"
                  value={field.value ?? ''}
                  placeholder="Shortages, overages, or anything to note?"
                  rows={3}
                  disabled={isPending || isLoading}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={
                    fieldState.error ? 'closing-notes-error' : 'closing-notes-count'
                  }
                  className="min-h-20"
                />
                <div className="flex items-start justify-between gap-3">
                  <FieldError id="closing-notes-error">{fieldState.error?.message}</FieldError>
                  <span
                    id="closing-notes-count"
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
          <Button type="submit" variant="destructive" disabled={isPending || isLoading}>
            {isPending || isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Ending...
              </span>
            ) : (
              'End shift'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
