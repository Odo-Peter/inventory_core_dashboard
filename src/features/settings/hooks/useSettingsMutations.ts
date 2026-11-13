import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { MyProfile } from '@/features/auth/interface';
import { queryKeys } from '@/lib/query-keys';

import { updateCurrentStore } from '../services/settings.service';
import type { UpdateStorePayload } from '../types';

export const useUpdateStoreSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStorePayload) => updateCurrentStore(payload),
    onSuccess: (store) => {
      // Every screen that shows the store reads this key (dashboard, settings,
      // future shell headers). Update it immediately with the PATCH response.
      queryClient.setQueryData(queryKeys.store.current, store);

      // /auth/me carries the store name used by the new-sale screen. Keep the
      // cached profile in sync without refetching the session.
      queryClient.setQueryData<MyProfile>(queryKeys.profile.me, (profile) =>
        profile ? { ...profile, store_name: store.name } : profile,
      );
    },
  });
};
