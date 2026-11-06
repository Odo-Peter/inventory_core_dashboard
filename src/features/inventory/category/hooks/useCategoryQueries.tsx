import { useQuery } from '@tanstack/react-query';
import { getItemUnits, listCategories, listItems } from '../services/category.service';
import { queryKeys } from '@/lib/query-keys';

import type { ListCategoriesQuery } from '../types';
import type { ListItemsQuery } from '../../items/types';

export const useListCategories = (params: ListCategoriesQuery) => {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => listCategories(params),
  });
};

export const useListItems = (params: ListItemsQuery) => {
  return useQuery({
    queryKey: queryKeys.items.list(params),
    queryFn: () => listItems(params),
  });
};

export const useListItemUnits = () => {
  return useQuery({
    queryKey: queryKeys.items.units,
    queryFn: getItemUnits,
    staleTime: 1000 * 60 * 60,
    select: (data) => data.units,
  });
};
