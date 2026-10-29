import axiosInstance from '@/lib/axiosInstance';
import type { CategoryResponse, ListCategoriesQuery, ListCategoryResponse } from '../types';
import type { CategoryFormInput, CategoryUpdateValues } from '../schemas/category-form.schema';

export const listCategories = async (
  params: ListCategoriesQuery = {},
): Promise<ListCategoryResponse> => {
  const { data } = await axiosInstance.get<ListCategoryResponse>('/categories', {
    params,
  });

  return data;
};

export const createCategory = async (payload: CategoryFormInput): Promise<CategoryResponse> => {
  const { data } = await axiosInstance.post<CategoryResponse>('/categories', payload);
  return data;
};

export const updateCategory = async (
  id: string,
  payload: CategoryUpdateValues,
): Promise<CategoryResponse> => {
  const { data } = await axiosInstance.patch<CategoryResponse>(`/categories/${id}`, payload);
  return data;
};
