import type { PaginationMeta } from '@/lib/pagination';

export interface ItemResponse {
  id: string;
  store_id: string;
  sku: string;
  barcode: string | null;
  image_key: string | null;
  name: string;
  category_id: string | null;
  unit: string;
  current_price: number;
  cost_price: number | null;
  stock_quantity: number;
  reorder_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListItemsResponse {
  data: ItemResponse[];
  meta: PaginationMeta;
}

export interface ListItemsQuery {
  page?: number;
  page_size?: number;
  category_id?: string;
  active?: boolean;
  q?: string;
  low_stock?: boolean;
}

export type CreateItemPayload = {
  name: string;
  barcode?: string | null;
  category_id?: string | null;
  unit: string;
  current_price: number;
  cost_price?: number | null;
  reorder_threshold?: number;
  active?: boolean;
  image?: File | null;
};

export type UpdateItemPayload = {
  barcode?: string | null;
  name?: string;
  category_id?: string | null;
  unit?: string;
  cost_price?: number | null;
  reorder_threshold?: number;
};

export interface ChangeItemPricePayload {
  new_price: number;
}

export interface PriceHistoryEntry {
  id: string;
  item_id: string;
  old_price: number;
  new_price: number;
  changed_by_staff_id: string | null;
  changed_by_name?: string | null; // present once the backend adds the join
  changed_at: string;
}

export interface PriceHistoryListResponse {
  data: PriceHistoryEntry[];
  meta: PaginationMeta;
}

export interface ImageVariantUrls {
  // match ImageVariantUrlsDto, e.g. thumb / medium / original
  [variant: string]: string;
}

export interface ItemImageResponse {
  item_id: string;
  image: ImageVariantUrls | null; // null after removal
}
