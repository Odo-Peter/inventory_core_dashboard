import { useQuery } from '@tanstack/react-query';
import { myProfile } from '../services/auth.service';
import { queryKeys } from '@/lib/query-keys';

export const useMyProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => myProfile(),
    enabled,
    // The root gate owns this query. Keep the cached profile while it is
    // revalidated so a role check never flickers through a "no access" state.
    staleTime: Infinity,
    // Role changes are reloaded server-side; pick them up when the tab regains
    // focus even though the profile itself is not considered stale.
    refetchOnWindowFocus: 'always',
  });
};
