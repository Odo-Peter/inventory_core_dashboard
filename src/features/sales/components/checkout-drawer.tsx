import { useEffect, useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
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
import { formatNaira } from '@/features/admin/staff/utils';
import type { ItemResponse } from '@/features/inventory/items/types';

import { useCreateSale } from '../hooks/useSalesMutations';
import { usePaymentOptions } from '../hooks/useSalesQueries';
import {
  checkoutSchema,
  type CheckoutFormInput,
  type CheckoutFormValues,
} from '../schemas/checkout-schema';
import { PAYMENT_METHODS, type CartLine, type CreateSalePayload, type Sale } from '../types';
import { getSaleErrorInfo, paymentMethodLabel, shouldRefreshItems } from '../utils';
import { ProductImage } from './product-image';

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  total: number;
  checkoutDisabled?: boolean;
  disabledReason?: string;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onRefreshItems: () => Promise<ItemResponse[] | undefined>;
  onSyncItems: (items: ItemResponse[]) => void;
  onCompleted: (sale: Sale) => void;
}

export function CheckoutDrawer({
  open,
  onOpenChange,
  lines,
  total,
  checkoutDisabled,
  disabledReason,
  onSetQuantity,
  onRemove,
  onRefreshItems,
  onSyncItems,
  onCompleted,
}: CheckoutDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">Checkout</SheetTitle>
          <SheetDescription>Review the cart and take payment.</SheetDescription>
        </SheetHeader>

        {open ? (
          <CheckoutForm
            lines={lines}
            total={total}
            checkoutDisabled={checkoutDisabled}
            disabledReason={disabledReason}
            onClose={() => onOpenChange(false)}
            onSetQuantity={onSetQuantity}
            onRemove={onRemove}
            onRefreshItems={onRefreshItems}
            onSyncItems={onSyncItems}
            onCompleted={onCompleted}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CheckoutForm({
  lines,
  total,
  checkoutDisabled,
  disabledReason,
  onClose,
  onSetQuantity,
  onRemove,
  onRefreshItems,
  onSyncItems,
  onCompleted,
}: {
  lines: CartLine[];
  total: number;
  checkoutDisabled?: boolean;
  disabledReason?: string;
  onClose: () => void;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onRefreshItems: () => Promise<ItemResponse[] | undefined>;
  onSyncItems: (items: ItemResponse[]) => void;
  onCompleted: (sale: Sale) => void;
}) {
  const createSale = useCreateSale();
  const {
    data: options,
    isLoading: optionsLoading,
    isError: optionsError,
    refetch,
  } = usePaymentOptions();

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [formError, setFormError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as unknown as Resolver<
      CheckoutFormInput,
      unknown,
      CheckoutFormValues
    >,
    defaultValues: { payment_method: 'cash', pos_account_id: '' },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;
  const method = form.watch('payment_method');

  const methodOptions = PAYMENT_METHODS.flatMap((value) =>
    options?.[value] ? [{ value, label: paymentMethodLabel(value) }] : [],
  );
  const accounts = method === 'cash' ? [] : (options?.[method]?.accounts ?? []);
  const accountKey = accounts.map((account) => account.id).join(',');

  useEffect(() => {
    const current = form.getValues('pos_account_id');

    if (method === 'cash') {
      if (current) form.setValue('pos_account_id', '');
      return;
    }

    if (accounts.length === 1) {
      if (current !== accounts[0].id) form.setValue('pos_account_id', accounts[0].id);
      return;
    }

    if (current && !accounts.some((account) => account.id === current)) {
      form.setValue('pos_account_id', '');
    }
  }, [method, accountKey, form]);

  const isPending = createSale.isPending || isSubmitting;
  const expectedTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.item.current_price,
    0,
  );

  async function onSubmit(values: CheckoutFormValues) {
    setFormError(null);

    const payload: CreateSalePayload = {
      items: lines.map((line) => ({ item_id: line.item.id, quantity: line.quantity })),
      payment_method: values.payment_method,
      ...(values.payment_method !== 'cash' ? { pos_account_id: values.pos_account_id } : {}),
      expected_total: expectedTotal,
      idempotency_key: idempotencyKey,
    };

    try {
      const sale = await createSale.mutateAsync(payload);
      // A retry must reuse the key, but the next sale needs a new one.
      setIdempotencyKey(crypto.randomUUID());
      onCompleted(sale);
    } catch (error) {
      const info = getSaleErrorInfo(error);

      if (shouldRefreshItems(info.code)) {
        const fresh = await onRefreshItems();
        if (fresh) {
          onSyncItems(fresh);
          setFlagged(
            new Set(
              lines
                .filter((line) => {
                  const freshItem = fresh.find((item) => item.id === line.item.id);
                  return (
                    !freshItem || !freshItem.active || freshItem.stock_quantity < line.quantity
                  );
                })
                .map((line) => line.item.id),
            ),
          );
        }
      }

      if (info.field) {
        form.setError('pos_account_id', { message: info.message });
        if (values.payment_method === 'cash') setFormError(info.message);
      } else {
        setFormError(info.message);
      }
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {checkoutDisabled ? (
            <div
              role="alert"
              className="border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              {disabledReason ?? 'You cannot complete a sale right now.'}
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
            >
              {formError}
            </div>
          ) : null}

          {lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          ) : (
            <ul aria-label="Sale items" className="divide-border divide-y rounded-md border">
              {lines.map((line) => {
                const unavailable =
                  flagged.has(line.item.id) ||
                  !line.item.active ||
                  line.item.stock_quantity < line.quantity;

                return (
                  <li
                    key={line.item.id}
                    data-testid={`checkout-line-${line.item.id}`}
                    className="flex flex-col gap-2 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <ProductImage
                        variants={line.item.variants}
                        alt={line.item.name}
                        className="size-12 shrink-0 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{line.item.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatNaira(line.item.current_price)} × {line.quantity} ={' '}
                          <span className="font-medium">
                            {formatNaira(line.item.current_price * line.quantity)}
                          </span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${line.item.name}`}
                        onClick={() => onRemove(line.item.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`Decrease quantity for ${line.item.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() => onSetQuantity(line.item.id, line.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="min-w-8 text-center text-sm tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`Increase quantity for ${line.item.name}`}
                        disabled={line.quantity >= line.item.stock_quantity}
                        onClick={() => onSetQuantity(line.item.id, line.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>

                    {unavailable ? (
                      <p role="alert" className="text-destructive text-xs">
                        {!line.item.active
                          ? 'This item is no longer available. Remove it to continue.'
                          : `Only ${line.item.stock_quantity} left. Lower the quantity to continue.`}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatNaira(total)}</span>
          </div>

          <Field label="Payment method" htmlFor="checkout-payment-method" required>
            <Controller
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <Select
                  items={methodOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    if (!value) return;
                    field.onChange(value);
                    form.setValue('pos_account_id', '');
                    form.clearErrors('pos_account_id');
                    setFormError(null);
                  }}
                  disabled={optionsLoading || optionsError || methodOptions.length === 0}
                >
                  <SelectTrigger
                    id="checkout-payment-method"
                    className="w-full data-[size=default]:h-10"
                  >
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="rounded-md">
                    {methodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {optionsError ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-destructive">Could not load payment options.</span>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {method !== 'cash' ? (
            <Field
              label="POS account"
              htmlFor="checkout-pos-account"
              required
              error={errors.pos_account_id?.message}
            >
              <Controller
                control={form.control}
                name="pos_account_id"
                render={({ field }) => (
                  <Select
                    items={accounts.map((account) => ({
                      value: account.id,
                      label: account.label,
                    }))}
                    value={field.value ?? ''}
                    onValueChange={(value) => {
                      field.onChange(value ?? '');
                      form.clearErrors('pos_account_id');
                    }}
                  >
                    <SelectTrigger
                      id="checkout-pos-account"
                      className="w-full data-[size=default]:h-10"
                      aria-invalid={!!errors.pos_account_id}
                    >
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="rounded-md">
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || checkoutDisabled || lines.length === 0}
            title={checkoutDisabled ? disabledReason : undefined}
          >
            {isPending ? (
              <>
                <Spinner className="size-4" />
                Saving...
              </>
            ) : (
              'Complete sale'
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
