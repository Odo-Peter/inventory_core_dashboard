import axiosInstance from '@/lib/axiosInstance';
import type { ListCategoriesQuery, ListCategoryResponse } from '../types';

export const listCategories = async (
  params: ListCategoriesQuery = {},
): Promise<ListCategoryResponse> => {
  const { data } = await axiosInstance.get<ListCategoryResponse>('/categories', {
    params,
  });

  return data;
};
