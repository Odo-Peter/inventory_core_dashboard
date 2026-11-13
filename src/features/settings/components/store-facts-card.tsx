import { Badge } from '@/components/ui/badge';
import { dateTimeFormatter } from '@/features/admin/staff/utils';

import type { StoreResponse } from '../types';
import { DetailGrid, DetailRow, SettingsCard } from './settings-card';

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function StoreFactsCard({ store }: { store: StoreResponse }) {
  return (
    <SettingsCard title="Store facts" description="Set up when the store was created.">
      <DetailGrid>
        <DetailRow label="Currency">{store.currency || '—'}</DetailRow>
        <DetailRow label="Timezone">{store.timezone || '—'}</DetailRow>
        <DetailRow label="Status">
          <Badge variant={store.active ? 'success' : 'inactive'}>
            {store.active ? 'Active' : 'Inactive'}
          </Badge>
        </DetailRow>
        <DetailRow label="Created">{formatCreatedAt(store.created_at)}</DetailRow>
      </DetailGrid>

      <p className="text-muted-foreground mt-4 text-xs">
        These were set up with the store and cannot be changed here.
      </p>
    </SettingsCard>
  );
}
