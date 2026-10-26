import { useQuery } from '@tanstack/react-query';
import { myProfile } from '../services/auth.service';

export const useMyProfile = () => {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => myProfile(),
  });
};
