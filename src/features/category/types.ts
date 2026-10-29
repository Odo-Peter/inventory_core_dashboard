import type { PaginationMeta } from '@/lib/pagination';

export interface CategoryResponse {
  id: string;
  store_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ListCategoryResponse = {
  data: CategoryResponse[];
  meta: PaginationMeta;
};

export interface ListCategoriesQuery {
  page?: number;
  page_size?: number;
  active?: boolean;
  q?: string;
}
