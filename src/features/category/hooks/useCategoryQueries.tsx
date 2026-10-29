import { useQuery } from '@tanstack/react-query';
import { listCategories } from '../services/category.service';
import { queryKeys } from '@/lib/query-keys';
import type { ListCategoriesQuery } from '../types';

export const useListCategories = (params: ListCategoriesQuery) => {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => listCategories(params),
  });
};
