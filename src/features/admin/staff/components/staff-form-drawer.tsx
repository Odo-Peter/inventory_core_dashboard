import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

import {
  staffFormSchema,
  type StaffFormInput,
  type StaffFormValues,
} from '../schemas/staff-form.schema';
import { staffRoleOptions, type Staff } from '../types';

interface StaffFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  staff?: Staff | null;
  onSubmit: (values: StaffFormValues) => void;
}

const emptyValues: StaffFormInput = {
  staff_code: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'cashier',
};

export function StaffFormDrawer({
  open,
  onOpenChange,
  mode,
  staff,
  onSubmit,
}: StaffFormDrawerProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormInput, unknown, StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      staff
        ? {
            staff_code: staff.staff_code,
            first_name: staff.first_name,
            last_name: staff.last_name,
            phone: staff.phone,
            role: staff.role,
          }
        : emptyValues,
    );
  }, [open, staff, reset]);

  const submitForm = handleSubmit((values) => {
    onSubmit(values);
    onOpenChange(false);
  });

  const isEdit = mode === 'edit';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle>{isEdit ? 'Edit staff' : 'Add staff'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update this staff member’s profile and access role.'
              : 'Create a staff account and assign an access role.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submitForm} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <Input
              htmlFor="staff-code"
              label="Staff code"
              placeholder="e.g. CASHIER003"
              autoComplete="off"
              required
              error={!!errors.staff_code}
              errorText={errors.staff_code?.message}
              {...register('staff_code')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                htmlFor="staff-first-name"
                label="First name"
                placeholder="e.g. Ada"
                autoComplete="given-name"
                required
                error={!!errors.first_name}
                errorText={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                htmlFor="staff-last-name"
                label="Last name"
                placeholder="e.g. Okafor"
                autoComplete="family-name"
                required
                error={!!errors.last_name}
                errorText={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>

            <Input
              htmlFor="staff-phone"
              label="Phone number"
              type="tel"
              inputMode="tel"
              placeholder="+234 803 123 4567"
              autoComplete="tel"
              required
              error={!!errors.phone}
              errorText={errors.phone?.message}
              {...register('phone')}
            />

            <Field label="Role" htmlFor="staff-role" required>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    items={staffRoleOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) {
                        field.onChange(value);
                      }
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Update Staff' : 'Save Staff'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
