import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getItemUnits,
  listCategories,
  listItemPriceHistory,
  listItems,
} from '../services/category.service';
import { queryKeys } from '@/lib/query-keys';
import { useRoleEnabled } from '@/lib/rbac';

import type { ListCategoriesQuery } from '../types';
import type { ListItemsQuery } from '../../items/types';

export const useListCategories = (params: ListCategoriesQuery) => {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => listCategories(params),
    enabled: useRoleEnabled('categoriesView'),
  });
};

export const useListItems = (params: ListItemsQuery) => {
  return useQuery({
    queryKey: queryKeys.items.list(params),
    queryFn: () => listItems(params),
    enabled: useRoleEnabled('inventoryView'),
  });
};

export const useListItemUnits = () => {
  return useQuery({
    queryKey: queryKeys.items.units,
    queryFn: getItemUnits,
    staleTime: 1000 * 60 * 60,
    select: (data) => data.units,
    enabled: useRoleEnabled('inventoryView'),
  });
};

export function useItemPriceHistory(itemId: string | null, pageSize = 5) {
  return useInfiniteQuery({
    // Nested under itemKeys.all, so useChangeItemPrice's existing invalidation refreshes it
    queryKey: [...queryKeys.items.all, 'price-history', itemId, pageSize] as const,
    queryFn: ({ pageParam }) =>
      listItemPriceHistory(itemId as string, { page: pageParam, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.total_pages ? last.meta.page + 1 : undefined,
    enabled: useRoleEnabled('itemPriceHistory', !!itemId),
  });
}
