import { useQuery } from '@tanstack/react-query';
import { myProfile } from '../services/auth.service';
import { queryKeys } from '@/lib/query-keys';

export const useMyProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: myProfile,
    enabled,
  });
};
