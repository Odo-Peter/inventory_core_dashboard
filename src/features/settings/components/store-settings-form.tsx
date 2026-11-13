import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { useCan } from '@/lib/rbac';

import { useUpdateStoreSettings } from '../hooks/useSettingsMutations';
import { getStoreChanges } from '../lib/store-changes';
import {
  storeSettingsFormSchema,
  type StoreSettingsFormInput,
  type StoreSettingsValues,
} from '../schemas/store-settings.schema';
import { toStoreSettingsFormValues, type StoreResponse } from '../types';
import { ReceiptCard } from './receipt-card';
import { StoreDetailsCard } from './store-details-card';

interface StoreSettingsFormProps {
  store: StoreResponse;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const canEdit = useCan('storeEdit');
  const updateStore = useUpdateStoreSettings();

  const form = useForm<StoreSettingsFormInput, unknown, StoreSettingsValues>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: toStoreSettingsFormValues(store),
  });

  const values = form.watch();
  const changes = getStoreChanges(values, store);
  const hasChanges = Object.keys(changes).length > 0;
  const isPending = updateStore.isPending;

  function resetForm() {
    form.reset(toStoreSettingsFormValues(store));
  }

  async function onSubmit(nextValues: StoreSettingsValues) {
    const payload = getStoreChanges(nextValues, store);
    if (Object.keys(payload).length === 0) return;

    try {
      const updated = await updateStore.mutateAsync(payload);
      form.reset(toStoreSettingsFormValues(updated));
      toast.success('Store details saved');
    } catch (error) {
      // Keep the values so the user can retry without retyping.
      toast.error(error instanceof Error ? error.message : 'Could not save store details');
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <StoreDetailsCard store={store} form={form} readOnly={!canEdit} />
        <ReceiptCard store={store} form={form} readOnly={!canEdit} />

        {canEdit ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {!hasChanges ? (
              <p className="text-muted-foreground text-xs">No changes to save</p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges || isPending}
              onClick={resetForm}
            >
              Reset
            </Button>

            <Button type="submit" disabled={!hasChanges || isPending}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-3.5 w-3.5" />
                  Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
