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
import PhoneInputField from '@/components/ui/form/phone-input';

import {
  staffFormSchema,
  staffUpdateSchema,
  type StaffFormInput,
  type StaffFormValues,
} from '../../schemas/staff-form.schema';
import { staffRoleOptions, type Staff } from '../types';
import { useCreateStaff, useUpdateStaff } from '../../hooks/adminMutations';
import type { CreatedStaffInfo } from './created-staff-dialog';

type FormMode = 'add' | 'edit';

interface StaffFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  staff?: Staff | null;
  onCreated?: (staff: CreatedStaffInfo) => void;
}

const emptyValues: StaffFormInput = {
  first_name: '',
  last_name: '',
  phone: '',
  role: 'cashier',
};

function toFormValues(staff?: Staff | null): StaffFormInput {
  if (!staff) return emptyValues;

  return {
    first_name: staff.first_name,
    last_name: staff.last_name,
    phone: staff.phone.replace(/\D/g, ''),
    role: staff.role,
  };
}

export function StaffFormDrawer({
  open,
  onOpenChange,
  mode,
  staff,
  onCreated,
}: StaffFormDrawerProps) {
  const isEdit = mode === 'edit';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">{isEdit ? 'Edit staff' : 'Add staff'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this staff member's profile and access role."
              : 'Create a staff account and assign an access role.'}
          </SheetDescription>
        </SheetHeader>

        {/* Mounted only while open, so every open starts from fresh default values */}
        {open && (
          <StaffForm
            mode={mode}
            staff={staff}
            onClose={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface StaffFormProps {
  mode: FormMode;
  staff?: Staff | null;
  onClose: () => void;
  onCreated?: (staff: CreatedStaffInfo) => void;
}

function StaffForm({ mode, staff, onClose, onCreated }: StaffFormProps) {
  const isEdit = mode === 'edit';

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const isPending = createStaff.isPending || updateStaff.isPending;

  const form = useForm<StaffFormInput, unknown, StaffFormValues>({
    resolver: zodResolver(isEdit ? staffUpdateSchema : staffFormSchema) as unknown as Resolver<
      StaffFormInput,
      unknown,
      StaffFormValues
    >,
    defaultValues: toFormValues(isEdit ? staff : null),
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: StaffFormValues) {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      role: values.role,
    };

    try {
      if (isEdit && staff) {
        const response = await updateStaff.mutateAsync({
          id: staff.id,
          payload: payload,
        });
        toast.success(`Staff "${response.name}" updated successfully`);
      } else {
        const response = await createStaff.mutateAsync(payload);
        onCreated?.({
          name: response.staff.name,
          staff_code: response.staff.staff_code,
          temporary_pin: response.temporary_pin,
        });
        toast.success(`${response.staff.name} added successfully`);
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
          {/* Staff name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      htmlFor="staff-first-name"
                      label="First name"
                      placeholder="e.g. Eze"
                      autoComplete="given-name"
                      required
                      error={!!errors.first_name}
                      errorText={errors.first_name?.message}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      htmlFor="staff-last-name"
                      label="Last name"
                      placeholder="e.g. Celestine"
                      autoComplete="family-name"
                      required
                      error={!!errors.last_name}
                      errorText={errors.last_name?.message}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Phone number */}
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <PhoneInputField
                label="Phone number"
                htmlFor="staff-phone"
                value={field.value}
                onChange={(val) => field.onChange(val)}
                onBlur={field.onBlur}
                country="ng"
                lockCountry
                required
                error={!!fieldState.error}
                errorText={fieldState.error?.message}
              />
            )}
          />

          {/* Role */}
          <Field label="Role" htmlFor="staff-role" required>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  items={staffRoleOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="staff-role"
                    className="w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? 'staff-role-error' : undefined}
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="staff-role-error">{errors.role?.message}</FieldError>
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
              'Update Staff'
            ) : (
              'Save Staff'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
