import { toast } from 'sonner';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';

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

import type { ItemResponse } from '../types';
import {
  itemFormSchema,
  type ItemFormInput,
  type ItemFormValues,
} from '../schemas/item-form-schema';
import { useCreateItem, useUpdateItem } from '../../category/hooks/useCategoryMutations';
import { formatNaira } from '@/features/admin/staff/utils';
import { Badge } from '@/components/ui/badge';
import { getItemChanges } from '../../category/lib/item-changes';
import { parseNairaToKobo } from '@/lib/money';

type FormMode = 'add' | 'edit';

interface ItemFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  units: { value: string; label: string }[];
  item?: ItemResponse | null;
  categories: { id: string; name: string }[];
  onSuccess?: () => void;
  onChangePrice?: (item: ItemResponse) => void;
  onRecordStock?: (item: ItemResponse) => void;
  onToggleStatus?: (item: ItemResponse) => void;
}

const emptyValues: ItemFormInput = {
  name: '',
  barcode: '',
  category_id: '',
  unit: 'bottle',
  current_price: '',
  cost_price: '',
  reorder_threshold: '0',
  active: 'true',
};

function toFormValues(item?: ItemResponse | null): ItemFormInput {
  if (!item) return emptyValues;

  return {
    name: item.name ?? '',
    barcode: item.barcode ?? '',
    category_id: item.category_id ?? '',
    unit: item.unit ?? '',
    current_price: String(item.current_price ?? ''),
    cost_price: item.cost_price == null ? '' : String(item.cost_price),
    reorder_threshold: String(item.reorder_threshold ?? 0),
    active: item.active ? 'true' : 'false',
  };
}

function ManagedRow({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string;
  value: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAction} disabled={!onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function ManagedSeparately({
  item,
  onChangePrice,
  onRecordStock,
  onToggleStatus,
}: {
  item: ItemResponse;
  onChangePrice?: (item: ItemResponse) => void;
  onRecordStock?: (item: ItemResponse) => void;
  onToggleStatus?: (item: ItemResponse) => void;
}) {
  return (
    <section className="border-border rounded-md border">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-medium">Managed separately</h3>
        <p className="text-muted-foreground text-xs">
          Saving this form does not change these. Use the buttons to change them.
        </p>
      </div>
      <dl className="divide-border divide-y">
        <ManagedRow
          label="Selling price"
          value={formatNaira(item.current_price)}
          actionLabel="Change price"
          onAction={onChangePrice && (() => onChangePrice(item))}
        />
        <ManagedRow
          label="Stock on hand"
          value={`${item.stock_quantity} ${item.unit}`}
          actionLabel="Record movement"
          onAction={onRecordStock && (() => onRecordStock(item))}
        />
        <ManagedRow
          label="Status"
          value={
            <Badge variant={item.active ? 'success' : 'secondary'}>
              {item.active ? 'Active' : 'Inactive'}
            </Badge>
          }
          actionLabel={item.active ? 'Deactivate' : 'Reactivate'}
          onAction={onToggleStatus && (() => onToggleStatus(item))}
        />
      </dl>
    </section>
  );
}

export function ItemFormDrawer({
  open,
  onOpenChange,
  mode,
  units,
  item,
  categories,
  onSuccess,
  onChangePrice,
  onRecordStock,
  onToggleStatus,
}: ItemFormDrawerProps) {
  const isEdit = mode === 'edit';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">{isEdit ? 'Edit item' : 'Add item'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update item details, pricing, and status.'
              : 'Add a new item to your store inventory. SKU is generated automatically.'}
          </SheetDescription>
        </SheetHeader>

        {/* Mount only while open so every open starts with fresh defaults */}
        {open && (
          <ItemForm
            mode={mode}
            item={item}
            categories={categories}
            units={units}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            onChangePrice={onChangePrice}
            onRecordStock={onRecordStock}
            onToggleStatus={onToggleStatus}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface ItemFormProps {
  mode: FormMode;
  item?: ItemResponse | null;
  categories: { id: string; name: string }[];
  units: { value: string; label: string }[];
  onClose: () => void;
  onSuccess?: () => void;
  onChangePrice?: (item: ItemResponse) => void;
  onRecordStock?: (item: ItemResponse) => void;
  onToggleStatus?: (item: ItemResponse) => void;
}

function ItemForm({
  mode,
  item,
  categories,
  onClose,
  onSuccess,
  units,
  onChangePrice,
  onRecordStock,
  onToggleStatus,
}: ItemFormProps) {
  const isEdit = mode === 'edit';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const isPending = createItem.isPending || updateItem.isPending;

  const form = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemFormSchema) as unknown as Resolver<
      ItemFormInput,
      unknown,
      ItemFormValues
    >,
    defaultValues: toFormValues(isEdit ? item : null),
  });

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ] as const;

  const categoryOptions = [
    { value: 'none', label: 'Uncategorized' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const {
    formState: { errors },
  } = form;

  const currentPrice = parseNairaToKobo(form.watch('current_price')) ?? 0;
  const costPrice = parseNairaToKobo(form.watch('cost_price')) ?? 0;
  const watched = form.watch();
  const changes = isEdit && item ? getItemChanges(watched, item) : {};
  const hasChanges = Object.keys(changes).length > 0;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onSubmit(values: ItemFormValues) {
    try {
      if (isEdit && item) {
        const payload = getItemChanges(values, item);
        if (Object.keys(payload).length === 0) return;

        await updateItem.mutateAsync({ id: item.id, payload });
        toast.success(`Item "${item.name}" updated successfully`);
      } else {
        await createItem.mutateAsync({
          name: values.name,
          barcode: values.barcode?.trim() || null,
          category_id:
            values.category_id && values.category_id !== 'none' ? values.category_id : null,
          unit: values.unit,
          current_price: parseNairaToKobo(values.current_price) as number,
          cost_price: values.cost_price ? parseNairaToKobo(values.cost_price) : null,
          reorder_threshold:
            values.reorder_threshold === '' || values.reorder_threshold == null
              ? 0
              : Math.round(Number(values.reorder_threshold)),
          active: values.active === 'true',
          image: imageFile ?? undefined,
        });
        toast.success(`Item "${values.name}" created successfully`);
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
          {/* Item name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="item-name"
                    label="Item name"
                    placeholder="e.g. Coca-Cola 50cl"
                    required
                    error={!!errors.name}
                    errorText={errors.name?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Barcode */}
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="item-barcode"
                    label="Barcode"
                    placeholder="Optional scan code"
                    error={!!errors.barcode}
                    errorText={errors.barcode?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Category */}
          <Field label="Category" htmlFor="item-category">
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Select
                  items={categoryOptions}
                  value={field.value || 'none'}
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? '' : (value ?? ''));
                  }}
                >
                  <SelectTrigger
                    id="item-category"
                    className="w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.category_id}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="rounded-md">
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="item-category-error">{errors.category_id?.message}</FieldError>
          </Field>

          {/* Unit */}
          <Field label="Unit" htmlFor="item-unit" required>
            <Controller
              control={form.control}
              name="unit"
              render={({ field }) => (
                <Select
                  items={units}
                  value={field.value || 'none'}
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? '' : (value ?? ''));
                  }}
                >
                  <SelectTrigger
                    id="unit"
                    className="w-full rounded-sm data-[size=default]:h-10"
                    aria-invalid={!!errors.unit}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="rounded-md">
                    {units.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="unit-error">{errors.unit?.message}</FieldError>
          </Field>

          {/* Prices + reorder */}
          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <FormField
                control={form.control}
                name="current_price"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input
                        htmlFor="item-current-price"
                        label="Selling price"
                        type="number"
                        required
                        min={0}
                        step="1"
                        error={!!errors.current_price}
                        errorText={errors.current_price?.message}
                        helpText={
                          currentPrice ? (
                            <span className="font-semibold text-emerald-700">
                              {formatNaira(currentPrice)}
                            </span>
                          ) : null
                        }
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="cost_price"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormControl>
                    <Input
                      htmlFor="item-cost-price"
                      label="Cost price"
                      type="number"
                      min={0}
                      step="1"
                      error={!!errors.cost_price}
                      errorText={errors.cost_price?.message}
                      helpText={
                        costPrice ? (
                          <span className="font-semibold text-emerald-700">
                            {formatNaira(costPrice)}
                          </span>
                        ) : null
                      }
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {isEdit && item && (
            <ManagedSeparately
              item={item}
              onChangePrice={onChangePrice}
              onRecordStock={onRecordStock}
              onToggleStatus={onToggleStatus}
            />
          )}

          {!isEdit && (
            <p className="text-muted-foreground text-xs">
              New items start with 0 stock. After saving, use Record movement to add opening stock.
            </p>
          )}

          {/* Status */}
          {!isEdit && (
            <Field label="Status" htmlFor="item-active" required>
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
                      id="item-active"
                      className="w-full data-[size=default]:h-10"
                      aria-invalid={!!errors.active}
                      aria-describedby={errors.active ? 'item-active-error' : undefined}
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
              <FieldError id="item-active-error">{errors.active?.message}</FieldError>
            </Field>
          )}

          {/* Image upload (create only, or both if your update supports it) */}
          {!isEdit && (
            <Field label="Image" htmlFor="item-image">
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  id="item-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={clearImage}
                    >
                      Remove Item Image
                    </Button>
                  </div>
                )}
              </div>
            </Field>
          )}
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          {isEdit && !hasChanges && (
            <span className="text-muted-foreground mr-auto text-xs">No changes to save</span>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || (isEdit && !hasChanges)}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Saving...
              </span>
            ) : isEdit ? (
              'Update Item'
            ) : (
              'Save Item'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
