import { PageHeader } from '@/components/shared/page-header';
import { LoadErrorState } from '@/components/states';

import { AccountCard } from '../components/account-card';
import { SettingsCardSkeleton } from '../components/settings-card';
import { ShortcutsCard } from '../components/shortcuts-card';
import { StoreFactsCard } from '../components/store-facts-card';
import { StoreSettingsForm } from '../components/store-settings-form';
import { useSettingsStore } from '../hooks/useSettingsQueries';

export function SettingsPage() {
  const { data: store, isPending, isError, refetch } = useSettingsStore();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" description="Store and app preferences." />

      <AccountCard storeName={store?.name} />

      {isPending ? (
        <>
          <SettingsCardSkeleton title="Store details" lines={4} />
          <SettingsCardSkeleton title="Receipt" lines={5} />
          <SettingsCardSkeleton title="Store facts" lines={4} />
        </>
      ) : isError ? (
        <LoadErrorState
          title="Could not load store settings"
          description="Check your connection and try again."
          onRetry={() => void refetch()}
        />
      ) : store ? (
        <>
          <StoreSettingsForm store={store} />
          <StoreFactsCard store={store} />
        </>
      ) : null}

      <ShortcutsCard />
    </div>
  );
}
