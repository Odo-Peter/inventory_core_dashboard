import type { UseFormReturn } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

import {
  STORE_FIELD_LIMITS,
  type StoreSettingsFormInput,
  type StoreSettingsValues,
} from '../schemas/store-settings.schema';
import type { StoreResponse } from '../types';
import { ReceiptPreview } from './receipt-preview';
import { SettingsCard } from './settings-card';

type SettingsForm = UseFormReturn<StoreSettingsFormInput, unknown, StoreSettingsValues>;

interface ReceiptCardProps {
  store: StoreResponse;
  form: SettingsForm;
  readOnly: boolean;
}

export function ReceiptCard({ store, form, readOnly }: ReceiptCardProps) {
  const values = form.watch();

  if (readOnly) {
    return (
      <SettingsCard
        title="Receipt"
        description="The footer printed at the bottom of every receipt."
      >
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {store.receipt_footer || 'No receipt footer set.'}
        </p>
        <div className="mt-4">
          <ReceiptPreview store={store} values={values} />
        </div>
      </SettingsCard>
    );
  }

  const footer = form.watch('receipt_footer');
  const { errors } = form.formState;

  return (
    <SettingsCard title="Receipt" description="The footer printed at the bottom of every receipt.">
      <div className="flex flex-col gap-4">
        <Field
          label="Receipt footer"
          htmlFor="receipt-footer"
          error={errors.receipt_footer?.message}
          helpText={`${footer.length} / ${STORE_FIELD_LIMITS.receiptFooter} characters`}
        >
          <Textarea
            id="receipt-footer"
            maxLength={STORE_FIELD_LIMITS.receiptFooter}
            placeholder="Thank you for your custom"
            aria-invalid={!!errors.receipt_footer}
            aria-describedby={errors.receipt_footer ? 'receipt-footer-error' : undefined}
            {...form.register('receipt_footer')}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Preview</h3>
          <ReceiptPreview store={store} values={values} />
        </div>
      </div>
    </SettingsCard>
  );
}
