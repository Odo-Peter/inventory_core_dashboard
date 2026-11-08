import { toast } from 'sonner';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatNaira } from '@/features/admin/staff/utils';

import { useChangeItemPrice } from '../../category/hooks/useCategoryMutations';
import type { ItemResponse } from '../types';
import { changePriceSchema, type ChangePriceInput } from '../schemas/item-form-schema';
import { parseNairaToKobo } from '@/lib/money';

interface ChangePriceDialogProps {
  item: ItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updated: ItemResponse) => void;
}

export function ChangePriceDialog({ item, open, onOpenChange, onSuccess }: ChangePriceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {/* Mount only while open so each open starts empty */}
        {open && item && (
          <ChangePriceForm item={item} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangePriceForm({
  item,
  onClose,
  onSuccess,
}: {
  item: ItemResponse;
  onClose: () => void;
  onSuccess?: (updated: ItemResponse) => void;
}) {
  const changePrice = useChangeItemPrice();

  const form = useForm<ChangePriceInput>({
    resolver: zodResolver(changePriceSchema) as unknown as Resolver<ChangePriceInput>,
    defaultValues: { new_price: '' },
  });

  const raw = form.watch('new_price');
  const nextKobo = parseNairaToKobo(raw);
  const valid = nextKobo !== null;
  const unchanged = valid && nextKobo === item.current_price;
  const diff = valid ? nextKobo - item.current_price : 0;
  const pct = valid && item.current_price > 0 ? (diff / item.current_price) * 100 : null;

  async function onSubmit() {
    if (nextKobo === null) return;
    try {
      const updated = await changePrice.mutateAsync({
        id: item.id,
        payload: { new_price: nextKobo },
      });
      toast.success(`Price for "${item.name}" is now ${formatNaira(updated.current_price)}`);
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not change the price');
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change price</DialogTitle>
        <DialogDescription>
          {item.name}. The change is recorded in the item's price history.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-muted-foreground text-xs">Current price</span>
            <span className="text-sm font-semibold">{formatNaira(item.current_price)}</span>
          </div>

          <FormField
            control={form.control}
            name="new_price"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="change-price-new"
                    label="New price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step="1"
                    required
                    autoFocus
                    error={!!form.formState.errors.new_price || unchanged}
                    errorText={
                      form.formState.errors.new_price?.message ??
                      (unchanged ? 'This is already the current price' : undefined)
                    }
                    helpText={
                      valid && !unchanged ? (
                        <span className={diff > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                          {diff > 0 ? '+' : '−'}
                          {formatNaira(Math.abs(diff))}
                          {pct !== null
                            ? ` (${diff > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%)`
                            : ''}
                        </span>
                      ) : null
                    }
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={changePrice.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || unchanged || changePrice.isPending}>
              {changePrice.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-3.5 w-3.5" />
                  Saving...
                </span>
              ) : (
                'Update price'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
