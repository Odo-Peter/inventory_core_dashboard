import { toast } from 'sonner';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FieldError } from '@/components/states/validation';
import { Input } from '@/components/ui/form/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';

import { posAccountTypeOptions, type PosAccount } from '../types';
import { useCreatePosAccount, useUpdatePosAccount } from '../hooks/usePosMutations';
import {
  type PosAccountFormInput,
  posAccountFormSchema,
  type PosAccountFormValues,
} from '../schemas/pos-form-schema';

type FormMode = 'add' | 'edit';

interface PosAccountFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  account?: PosAccount | null;
}

const emptyValues: PosAccountFormInput = {
  label: '',
  type: 'pos_terminal',
  details: {},
};

function toFormValues(account?: PosAccount | null): PosAccountFormInput {
  if (!account) return emptyValues;

  return {
    label: account.label,
    type: account.type,
    details: account.details ?? {},
  };
}

export function PosAccountFormDrawer({
  open,
  onOpenChange,
  mode,
  account,
}: PosAccountFormDrawerProps) {
  const isEdit = mode === 'edit';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">
            {isEdit ? 'Edit POS account' : 'Add POS account'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the label or type of this POS account.'
              : 'Register a new POS terminal or payment account.'}
          </SheetDescription>
        </SheetHeader>

        {open && (
          <PosAccountForm mode={mode} account={account} onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface PosAccountFormProps {
  mode: FormMode;
  account?: PosAccount | null;
  onClose: () => void;
}

function PosAccountForm({ mode, account, onClose }: PosAccountFormProps) {
  const isEdit = mode === 'edit';

  const createAccount = useCreatePosAccount();
  const updateAccount = useUpdatePosAccount();
  const isPending = createAccount.isPending || updateAccount.isPending;

  const form = useForm<PosAccountFormInput, unknown, PosAccountFormValues>({
    resolver: zodResolver(posAccountFormSchema) as unknown as Resolver<
      PosAccountFormInput,
      unknown,
      PosAccountFormValues
    >,
    defaultValues: toFormValues(isEdit ? account : null),
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: PosAccountFormValues) {
    const payload = {
      label: values.label,
      type: values.type,
      ...(values.details && Object.keys(values.details).length > 0
        ? { details: values.details }
        : {}),
    };

    try {
      if (isEdit && account) {
        const response = await updateAccount.mutateAsync({
          id: account.id,
          payload,
        });
        toast.success(`POS account "${response.label}" updated`);
      } else {
        const response = await createAccount.mutateAsync(payload);
        toast.success(`POS account "${response.label}" created`);
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="pos-label"
                    label="Label"
                    placeholder="e.g. Front Counter Terminal"
                    required
                    error={!!errors.label}
                    errorText={errors.label?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Field label="Type" htmlFor="pos-type" required>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  items={posAccountTypeOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="pos-type"
                    className="w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.type}
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {posAccountTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="pos-type-error">{errors.type?.message}</FieldError>
          </Field>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Saving...
              </span>
            ) : isEdit ? (
              'Update Account'
            ) : (
              'Create Account'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
