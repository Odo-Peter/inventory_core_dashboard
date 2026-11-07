import { parseNairaToKobo } from '@/lib/money';
import type { ItemFormInput } from '../../items/schemas/item-form-schema';
import type { ItemResponse, UpdateItemPayload } from '../../items/types';

const collapse = (v: string | undefined) => (v ?? '').trim().replace(/\s+/g, ' ');

/** Only the fields that differ from the saved item, in the shape PATCH expects. */
export function getItemChanges(values: ItemFormInput, item: ItemResponse): UpdateItemPayload {
  const changes: UpdateItemPayload = {};

  const name = collapse(values.name);
  if (name && name !== item.name) changes.name = name;

  const barcode = (values.barcode ?? '').trim() || null;
  if (barcode !== (item.barcode ?? null)) changes.barcode = barcode;

  const categoryId =
    values.category_id && values.category_id !== 'none' ? values.category_id : null;
  if (categoryId !== (item.category_id ?? null)) changes.category_id = categoryId;

  if (values.unit && values.unit !== item.unit) changes.unit = values.unit;

  const costRaw = (values.cost_price ?? '').trim();
  const cost = costRaw === '' ? null : parseNairaToKobo(costRaw);
  if (cost !== undefined && cost !== (item.cost_price ?? null)) {
    // an invalid string parses to null, which the schema already rejects
    if (costRaw === '' || cost !== null) changes.cost_price = cost;
  }

  const reorderRaw = (values.reorder_threshold ?? '').trim();
  const reorder = reorderRaw === '' ? 0 : Number(reorderRaw);
  if (!Number.isNaN(reorder) && reorder !== item.reorder_threshold) {
    changes.reorder_threshold = Math.round(reorder);
  }

  return changes;
}
