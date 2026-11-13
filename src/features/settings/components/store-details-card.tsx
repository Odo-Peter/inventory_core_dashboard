import type { UseFormReturn } from 'react-hook-form';

import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/form/input';

import type { StoreSettingsFormInput, StoreSettingsValues } from '../schemas/store-settings.schema';
import type { StoreResponse } from '../types';
import { DetailGrid, DetailRow, SettingsCard } from './settings-card';

type SettingsForm = UseFormReturn<StoreSettingsFormInput, unknown, StoreSettingsValues>;

interface StoreDetailsCardProps {
  store: StoreResponse;
  form: SettingsForm;
  readOnly: boolean;
}

export function StoreDetailsCard({ store, form, readOnly }: StoreDetailsCardProps) {
  if (readOnly) {
    return (
      <SettingsCard
        title="Store details"
        description="Your role can view the store details, but only an admin can change them."
      >
        <DetailGrid>
          <DetailRow label="Name">{store.name || '—'}</DetailRow>
          <DetailRow label="Address">{store.address || '—'}</DetailRow>
          <DetailRow label="Phone">{store.phone || '—'}</DetailRow>
        </DetailGrid>
      </SettingsCard>
    );
  }

  const { errors } = form.formState;

  return (
    <SettingsCard
      title="Store details"
      description="These details appear on receipts and around the dashboard."
    >
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  htmlFor="store-name"
                  label="Name"
                  placeholder="Main Store"
                  required
                  error={!!errors.name}
                  errorText={errors.name?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="store-address"
                    label="Address"
                    placeholder="1 Main Street"
                    error={!!errors.address}
                    errorText={errors.address?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    htmlFor="store-phone"
                    label="Phone"
                    placeholder="+2348030000000"
                    error={!!errors.phone}
                    errorText={errors.phone?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
