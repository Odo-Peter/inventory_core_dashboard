import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FieldError } from '@/components/states/validation';
import { Input } from '@/components/ui/form/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
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
import { Spinner } from '@/components/ui/spinner';

import { useListItems } from '../../category/hooks/useCategoryQueries';
import { useItemStockStatus } from '../hooks/useStockMovementQueries';
import { useRecordMovement } from '../hooks/useStockMovementMutations';
import {
  movementFormSchema,
  type MovementFormInput,
  type MovementFormValues,
} from '../schemas/movement-form-schema';
import type { MovementAction, RecordMovementInput } from '../types';
import type { ItemResponse } from '../../items/types';

type PickedItem = Pick<ItemResponse, 'id' | 'name' | 'sku'>;

const ACTION_OPTIONS: { value: MovementAction; label: string }[] = [
  { value: 'receive', label: 'Receive stock (supplier delivery)' },
  { value: 'adjust', label: 'Adjust (correct the count)' },
  { value: 'damage', label: 'Damaged or lost' },
  { value: 'initial', label: 'Opening stock (first count)' },
];

const DIRECTION_OPTIONS = [
  { value: 'increase', label: 'Add to stock' },
  { value: 'decrease', label: 'Remove from stock' },
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  insufficient_stock: 'Stock cannot go below zero.',
  item_inactive: 'Reactivate this item before changing its stock this way.',
  initial_stock_exists: 'Opening stock has already been recorded for this item.',
  item_not_found: 'This item no longer exists.',
};

function getErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; response?: { data?: { code?: string } } };
  return e?.response?.data?.code ?? e?.code;
}

function getErrorMessage(err: unknown): string {
  const code = getErrorCode(err);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return err instanceof Error ? err.message : 'Could not record the movement.';
}

function buildDefaults(initialItem: PickedItem | null): MovementFormInput {
  return {
    item_id: initialItem?.id ?? '',
    action: 'receive',
    direction: 'increase',
    quantity: '',
    note: '',
    supplier_name: '',
    delivery_reference: '',
  };
}

interface RecordMovementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: PickedItem | null;
  onSuccess?: () => void;
}

export function RecordMovementDrawer({
  open,
  onOpenChange,
  initialItem = null,
  onSuccess,
}: RecordMovementDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">Record stock movement</SheetTitle>
          <SheetDescription>
            Every change is added to the ledger and cannot be edited later.
          </SheetDescription>
        </SheetHeader>

        {/* Mount only while open so every open starts with fresh defaults */}
        {open && (
          <MovementForm
            initialItem={initialItem}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface MovementFormProps {
  initialItem: PickedItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function MovementForm({ initialItem, onClose, onSuccess }: MovementFormProps) {
  const [item, setItem] = useState<PickedItem | null>(initialItem);
  const [search, setSearch] = useState('');

  const recordMovement = useRecordMovement();
  const isPending = recordMovement.isPending;

  const form = useForm<MovementFormInput, unknown, MovementFormValues>({
    resolver: zodResolver(movementFormSchema) as unknown as Resolver<
      MovementFormInput,
      unknown,
      MovementFormValues
    >,
    defaultValues: buildDefaults(initialItem),
  });

  const {
    formState: { errors },
  } = form;

  const action = form.watch('action');
  const direction = form.watch('direction');
  const quantity = form.watch('quantity');

  const { data: status } = useItemStockStatus(item?.id ?? null);
  const { data: results } = useListItems({
    page: 1,
    page_size: 6,
    active: true,
    ...(search.trim() ? { q: search.trim() } : {}),
  });

  const disabledReason: Partial<Record<MovementAction, string>> = {
    receive: status && !status.receive_allowed ? 'item is inactive' : undefined,
    initial: status && !status.opening_stock_allowed ? 'already has stock history' : undefined,
  };

  const actionOptions = ACTION_OPTIONS.map((o) => ({
    ...o,
    label: disabledReason[o.value] ? `${o.label}: ${disabledReason[o.value]}` : o.label,
    disabled: !!disabledReason[o.value],
  }));

  // If the loaded status makes the current action unavailable, fall back to "adjust"
  useEffect(() => {
    if (status && disabledReason[action]) form.setValue('action', 'adjust');
  }, [status]);

  const qty = Number(quantity);
  const qtyValid = quantity !== '' && Number.isInteger(qty) && qty > 0;
  const delta = !qtyValid
    ? 0
    : action === 'damage' || (action === 'adjust' && direction === 'decrease')
      ? -qty
      : qty;
  const after = status && qtyValid ? status.stock_quantity + delta : null;
  const overdraw = after !== null && after < 0;
  const noteRequired = action === 'adjust' || action === 'damage';

  const quantityError =
    errors.quantity?.message ?? (overdraw ? 'Stock cannot go below zero' : undefined);

  async function onSubmit(values: MovementFormValues) {
    if (!item) return;

    if (disabledReason[values.action]) {
      toast.error(`This action is unavailable: ${disabledReason[values.action]}.`);
      return;
    }

    if (overdraw) {
      form.setError('quantity', { message: 'Stock cannot go below zero' });
      return;
    }

    const quantityValue = Number(values.quantity);
    const note = values.note?.trim();
    const noteField = note ? { note } : {};

    const input: RecordMovementInput =
      values.action === 'adjust'
        ? {
            itemId: item.id,
            action: 'adjust',
            body: {
              quantity_change: values.direction === 'decrease' ? -quantityValue : quantityValue,
              ...noteField,
            },
          }
        : values.action === 'receive'
          ? {
              itemId: item.id,
              action: 'receive',
              body: {
                quantity: quantityValue,
                ...noteField,
                ...(values.supplier_name?.trim()
                  ? { supplier_name: values.supplier_name.trim() }
                  : {}),
                ...(values.delivery_reference?.trim()
                  ? { delivery_reference: values.delivery_reference.trim() }
                  : {}),
              },
            }
          : {
              itemId: item.id,
              action: values.action,
              body: { quantity: quantityValue, ...noteField },
            };

    try {
      await recordMovement.mutateAsync(input);
      toast.success(`Stock updated: ${item.name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      if (getErrorCode(error) === 'insufficient_stock') {
        form.setError('quantity', { message: ERROR_MESSAGES.insufficient_stock });
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Item */}
          <Field label="Item" htmlFor="movement-item-search" required>
            <Controller
              control={form.control}
              name="item_id"
              render={({ field }) =>
                item ? (
                  <div className="border-border flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        {item.sku}
                        {status ? ` · ${status.stock_quantity} in stock` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setItem(null);
                        field.onChange('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="movement-item-search"
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, SKU or barcode"
                      aria-invalid={!!errors.item_id}
                    />
                    <ul className="border-border divide-border max-h-48 divide-y overflow-y-auto rounded-md border">
                      {(results?.data ?? []).map((it) => (
                        <li key={it.id}>
                          <button
                            type="button"
                            className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                            onClick={() => {
                              setItem(it);
                              field.onChange(it.id);
                            }}
                          >
                            <span className="font-medium">{it.name}</span>
                            <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                              {it.sku}
                            </span>
                          </button>
                        </li>
                      ))}
                      {results && results.data.length === 0 && (
                        <li className="text-muted-foreground px-3 py-4 text-center text-sm">
                          No items found
                        </li>
                      )}
                    </ul>
                  </div>
                )
              }
            />
            <FieldError id="movement-item-error">{errors.item_id?.message}</FieldError>
          </Field>

          {/* What happened */}
          <Field label="What happened?" htmlFor="movement-action" required>
            <Controller
              control={form.control}
              name="action"
              render={({ field }) => (
                <Select
                  items={actionOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="movement-action"
                    className="w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.action}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="rounded-md">
                    {actionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="movement-action-error">{errors.action?.message}</FieldError>
          </Field>

          {/* Direction (adjust only) */}
          {action === 'adjust' && (
            <Field label="Direction" htmlFor="movement-direction" required>
              <Controller
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <Select
                    items={DIRECTION_OPTIONS}
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger
                      id="movement-direction"
                      className="w-full data-[size=default]:h-10"
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="rounded-md">
                      {DIRECTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="movement-quantity"
                    label="Quantity"
                    type="number"
                    inputMode="numeric"
                    required
                    min={1}
                    step="1"
                    error={!!quantityError}
                    errorText={quantityError}
                    helpText={
                      status && after !== null && !overdraw ? (
                        <span>
                          Stock: {status.stock_quantity} → <strong>{after}</strong>
                        </span>
                      ) : null
                    }
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Receive-only details */}
          {action === 'receive' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        htmlFor="movement-supplier"
                        label="Supplier"
                        placeholder="Supplier name e.g Acme Stores"
                        error={!!errors.supplier_name}
                        errorText={errors.supplier_name?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        htmlFor="movement-reference"
                        label="Delivery reference"
                        placeholder="Ref e.g INV-20418"
                        error={!!errors.delivery_reference}
                        errorText={errors.delivery_reference?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Note */}
          <Field label="Note" htmlFor="movement-note" required={noteRequired}>
            <Controller
              control={form.control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="movement-note"
                  rows={5}
                  placeholder={noteRequired ? 'Why is this needed?' : 'Enter a note (optional)'}
                  aria-invalid={!!errors.note}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            <FieldError id="movement-note-error">{errors.note?.message}</FieldError>
          </Field>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || overdraw}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3.5 w-3.5" />
                Saving...
              </span>
            ) : (
              'Record movement'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
