import { toast } from 'sonner';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

import type { CategoryResponse } from '../types';
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategoryMutations';

type FormMode = 'add' | 'edit';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  active: z.enum(['true', 'false']),
});

type CategoryFormInput = z.input<typeof categoryFormSchema>;
type CategoryFormValues = z.output<typeof categoryFormSchema>;

interface CategoryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  category?: CategoryResponse | null;
  onSuccess?: () => void;
}

const emptyValues: CategoryFormInput = {
  name: '',
  active: 'true',
};

function toFormValues(category?: CategoryResponse | null): CategoryFormInput {
  if (!category) return emptyValues;

  return {
    name: category.name ?? '',
    active: category.active ? 'true' : 'false',
  };
}

export function CategoryFormDrawer({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: CategoryFormDrawerProps) {
  const isEdit = mode === 'edit';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">
            {isEdit ? 'Edit category' : 'Add category'}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update this category’s name and status.' : 'Create a new product category.'}
          </SheetDescription>
        </SheetHeader>

        {/* Mount only while open so every open starts with fresh defaults */}
        {open && (
          <CategoryForm
            mode={mode}
            category={category}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CategoryFormProps {
  mode: FormMode;
  category?: CategoryResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function CategoryForm({ mode, category, onClose, onSuccess }: CategoryFormProps) {
  const isEdit = mode === 'edit';

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as unknown as Resolver<
      CategoryFormInput,
      unknown,
      CategoryFormValues
    >,
    defaultValues: toFormValues(isEdit ? category : null),
  });

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ] as const;

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: CategoryFormValues) {
    const payload = {
      name: values.name,
      active: values.active === 'true',
    };

    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          payload,
        });
        toast.success(`Category "${payload.name}" updated successfully`);
      } else {
        await createCategory.mutateAsync(payload);
        toast.success(`Category "${payload.name}" created successfully`);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Category name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="category-name"
                    label="Category name"
                    placeholder="e.g. Electronics"
                    required
                    error={!!errors.name}
                    errorText={errors.name?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Active status */}
          <Field label="Status" htmlFor="category-active" required>
            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <Select
                  items={statusOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="category-active"
                    className="w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.active}
                    aria-describedby={errors.active ? 'category-active-error' : undefined}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="rounded-md">
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="category-active-error">{errors.active?.message}</FieldError>
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
              'Update Category'
            ) : (
              'Save Category'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
