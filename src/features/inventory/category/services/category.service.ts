import axiosInstance from '@/lib/axiosInstance';
import type {
  CategoryResponse,
  ListCategoriesQuery,
  ListCategoryResponse,
  ListItemUnitsResponse,
} from '../types';
import type { CategoryFormInput, CategoryUpdateValues } from '../schemas/category-form.schema';
import type {
  ChangeItemPricePayload,
  CreateItemPayload,
  ItemImageResponse,
  ItemResponse,
  ListItemsQuery,
  ListItemsResponse,
  PriceHistoryListResponse,
  UpdateItemPayload,
} from '../../items/types';

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

export const listItems = async (params: ListItemsQuery = {}): Promise<ListItemsResponse> => {
  const { data } = await axiosInstance.get<ListItemsResponse>('/items', {
    params,
  });
  return data;
};

/** Exact, store-scoped barcode lookup used by the sales grid. */
export const getItemByBarcode = async (barcode: string): Promise<ItemResponse> => {
  const { data } = await axiosInstance.get<ItemResponse>(
    `/items/barcode/${encodeURIComponent(barcode.trim())}`,
  );
  return data;
};

export const createItem = async (payload: CreateItemPayload): Promise<ItemResponse> => {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('unit', payload.unit);
  formData.append('current_price', String(payload.current_price));

  // Optional scalar fields – only append when present
  if (payload.barcode != null && payload.barcode !== '') {
    formData.append('barcode', payload.barcode);
  }
  if (payload.category_id != null && payload.category_id !== '') {
    formData.append('category_id', payload.category_id);
  }
  if (payload.cost_price != null) {
    formData.append('cost_price', String(payload.cost_price));
  }
  if (payload.reorder_threshold != null) {
    formData.append('reorder_threshold', String(payload.reorder_threshold));
  }
  if (payload.active != null) {
    formData.append('active', String(payload.active));
  }

  if (payload.image) {
    formData.append('image', payload.image);
  }

  const { data } = await axiosInstance.post<ItemResponse>('/items', formData);
  return data;
};

export const updateItem = async (id: string, payload: UpdateItemPayload): Promise<ItemResponse> => {
  // Only send defined fields so partial updates work cleanly
  const body: Record<string, unknown> = {};

  if (payload.barcode !== undefined) {
    body.barcode = payload.barcode === '' ? null : payload.barcode;
  }
  if (payload.name !== undefined) {
    body.name = payload.name;
  }
  if (payload.category_id !== undefined) {
    body.category_id = payload.category_id === '' ? null : payload.category_id;
  }
  if (payload.unit !== undefined) {
    body.unit = payload.unit;
  }
  if (payload.cost_price !== undefined) {
    body.cost_price = payload.cost_price;
  }
  if (payload.reorder_threshold !== undefined) {
    body.reorder_threshold = payload.reorder_threshold;
  }

  const { data } = await axiosInstance.patch<ItemResponse>(`/items/${id}`, body);
  return data;
};

export const deactivateItem = async (id: string): Promise<ItemResponse> => {
  const { data } = await axiosInstance.post<ItemResponse>(`/items/${id}/deactivate`);
  return data;
};

export const getItemUnits = async (): Promise<ListItemUnitsResponse> => {
  const { data } = await axiosInstance.get<ListItemUnitsResponse>('/items/units');
  return data;
};

export const changeItemPrice = async (
  id: string,
  payload: ChangeItemPricePayload,
): Promise<ItemResponse> => {
  const { data } = await axiosInstance.post<ItemResponse>(`/items/${id}/price`, payload);
  return data;
};

export const reactivateItem = async (id: string): Promise<ItemResponse> => {
  const { data } = await axiosInstance.patch<ItemResponse>(`/items/${id}`, { active: true });
  return data;
};

export const listItemPriceHistory = async (
  id: string,
  params: { page: number; page_size: number },
): Promise<PriceHistoryListResponse> => {
  const { data } = await axiosInstance.get<PriceHistoryListResponse>(`/items/${id}/price-history`, {
    params,
  });
  return data;
};

export const uploadItemImage = async (id: string, file: File): Promise<ItemImageResponse> => {
  const body = new FormData();
  body.append('image', file);
  const { data } = await axiosInstance.put<ItemImageResponse>(`/items/${id}/image`, body);
  return data;
};

export const removeItemImage = async (id: string): Promise<ItemImageResponse> => {
  const { data } = await axiosInstance.delete<ItemImageResponse>(`/items/${id}/image`);
  return data;
};
