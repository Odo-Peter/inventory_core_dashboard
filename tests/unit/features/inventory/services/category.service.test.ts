import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from '@/lib/axiosInstance';
import {
  changeItemPrice,
  createCategory,
  createItem,
  deactivateItem,
  getItemUnits,
  listCategories,
  listItems,
  reactivateItem,
  removeItemImage,
  updateCategory,
  updateItem,
  uploadItemImage,
} from '@/features/inventory/category/services/category.service';
import { categoryFixtures, itemFixtures, itemMeta, makeItem } from '../../../../helpers/items';

vi.mock('@/lib/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axiosInstance);

describe('inventory category.service item APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists items with the supplied query parameters', async () => {
    const response = { data: itemFixtures, meta: itemMeta };
    mockedAxios.get.mockResolvedValue({ data: response });
    const params = {
      page: 2,
      page_size: 25,
      category_id: 'category-1',
      active: false,
      q: 'cola',
      low_stock: true,
    };

    const result = await listItems(params);

    expect(mockedAxios.get).toHaveBeenCalledWith('/items', { params });
    expect(result).toEqual(response);
  });

  it('creates an item using multipart form data and includes the image', async () => {
    const created = itemFixtures[1];
    mockedAxios.post.mockResolvedValue({ data: created });
    const image = new File(['image'], 'cola.png', { type: 'image/png' });

    const result = await createItem({
      name: 'Fanta 50cl',
      barcode: '9876543210',
      category_id: 'category-1',
      unit: 'bottle',
      current_price: 1200,
      cost_price: 900,
      reorder_threshold: 4,
      active: true,
      image,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/items', expect.any(FormData));
    const body = mockedAxios.post.mock.calls[0]?.[1] as FormData;
    expect(body.get('name')).toBe('Fanta 50cl');
    expect(body.get('barcode')).toBe('9876543210');
    expect(body.get('category_id')).toBe('category-1');
    expect(body.get('unit')).toBe('bottle');
    expect(body.get('current_price')).toBe('1200');
    expect(body.get('cost_price')).toBe('900');
    expect(body.get('reorder_threshold')).toBe('4');
    expect(body.get('active')).toBe('true');
    expect(body.get('image')).toBe(image);
    expect(result).toEqual(created);
  });

  it('omits blank optional fields from create form data', async () => {
    mockedAxios.post.mockResolvedValue({ data: itemFixtures[0] });

    await createItem({
      name: 'Loose Sweets',
      barcode: '',
      category_id: null,
      unit: 'pack',
      current_price: 500,
      cost_price: null,
      reorder_threshold: 0,
      active: false,
      image: null,
    });

    const body = mockedAxios.post.mock.calls[0]?.[1] as FormData;
    expect(body.has('barcode')).toBe(false);
    expect(body.has('category_id')).toBe(false);
    expect(body.has('cost_price')).toBe(false);
    expect(body.has('image')).toBe(false);
    expect(body.get('reorder_threshold')).toBe('0');
    expect(body.get('active')).toBe('false');
  });

  it('sends only defined update fields and converts empty values to null', async () => {
    const updated = { ...itemFixtures[0], name: 'Coca-Cola Zero' };
    mockedAxios.patch.mockResolvedValue({ data: updated });

    const result = await updateItem('item-1', {
      name: 'Coca-Cola Zero',
      barcode: '',
      category_id: '',
    });

    expect(mockedAxios.patch).toHaveBeenCalledWith('/items/item-1', {
      name: 'Coca-Cola Zero',
      barcode: null,
      category_id: null,
    });
    expect(result).toEqual(updated);
  });

  it('sends cost price and reorder threshold when they are part of the update', async () => {
    const updated = makeItem({ cost_price: 125000, reorder_threshold: 8 });
    mockedAxios.patch.mockResolvedValue({ data: updated });

    await updateItem('item-1', { cost_price: 125000, reorder_threshold: 8, unit: 'pack' });

    expect(mockedAxios.patch).toHaveBeenCalledWith('/items/item-1', {
      cost_price: 125000,
      reorder_threshold: 8,
      unit: 'pack',
    });
  });

  it('posts to the deactivate endpoint and returns the item', async () => {
    const deactivated = { ...itemFixtures[0], active: false };
    mockedAxios.post.mockResolvedValue({ data: deactivated });

    const result = await deactivateItem('item-1');

    expect(mockedAxios.post).toHaveBeenCalledWith('/items/item-1/deactivate');
    expect(result).toEqual(deactivated);
  });

  it('fetches the available item units', async () => {
    const response = { units: ['bottle', 'pack', 'carton'] };
    mockedAxios.get.mockResolvedValue({ data: response });

    const result = await getItemUnits();

    expect(mockedAxios.get).toHaveBeenCalledWith('/items/units');
    expect(result).toEqual(response);
  });

  it('lists categories with the supplied query parameters', async () => {
    const response = { data: categoryFixtures, meta: itemMeta };
    mockedAxios.get.mockResolvedValue({ data: response });
    const params = { page: 1, page_size: 100, active: true, q: 'bev' };

    const result = await listCategories(params);

    expect(mockedAxios.get).toHaveBeenCalledWith('/categories', { params });
    expect(result).toEqual(response);
  });

  it('creates and updates categories through the expected endpoints', async () => {
    const created = categoryFixtures[0];
    const updated = { ...categoryFixtures[0], name: 'Drinks' };
    mockedAxios.post.mockResolvedValue({ data: created });
    mockedAxios.patch.mockResolvedValue({ data: updated });

    await expect(createCategory({ name: 'Beverages' })).resolves.toEqual(created);
    await expect(updateCategory('category-1', { name: 'Drinks' })).resolves.toEqual(updated);

    expect(mockedAxios.post).toHaveBeenCalledWith('/categories', { name: 'Beverages' });
    expect(mockedAxios.patch).toHaveBeenCalledWith('/categories/category-1', { name: 'Drinks' });
  });

  it('changes an item price through the dedicated price endpoint', async () => {
    const updated = makeItem({ current_price: 200000 });
    mockedAxios.post.mockResolvedValue({ data: updated });

    const result = await changeItemPrice('item-1', { new_price: 200000 });

    expect(mockedAxios.post).toHaveBeenCalledWith('/items/item-1/price', { new_price: 200000 });
    expect(result).toEqual(updated);
  });

  it('reactivates an item with a partial active update', async () => {
    const reactivated = makeItem({ active: true });
    mockedAxios.patch.mockResolvedValue({ data: reactivated });

    const result = await reactivateItem('item-1');

    expect(mockedAxios.patch).toHaveBeenCalledWith('/items/item-1', { active: true });
    expect(result).toEqual(reactivated);
  });

  it('uploads an item image as multipart form data and returns the variants', async () => {
    const response = { item_id: 'item-1', image: { thumb: 'thumb.webp', full: 'full.webp' } };
    mockedAxios.put.mockResolvedValue({ data: response });
    const file = new File(['image'], 'cola.png', { type: 'image/png' });

    const result = await uploadItemImage('item-1', file);

    expect(mockedAxios.put).toHaveBeenCalledWith('/items/item-1/image', expect.any(FormData));
    const body = mockedAxios.put.mock.calls[0]?.[1] as FormData;
    expect(body.get('image')).toBe(file);
    expect(result).toEqual(response);
  });

  it('removes an item image and returns the null image response', async () => {
    const response = { item_id: 'item-1', image: null };
    mockedAxios.delete.mockResolvedValue({ data: response });

    const result = await removeItemImage('item-1');

    expect(mockedAxios.delete).toHaveBeenCalledWith('/items/item-1/image');
    expect(result).toEqual(response);
  });
});
