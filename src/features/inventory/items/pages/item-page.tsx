import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { ItemFiltersBar, type ItemFilters } from '../components/item-filters';
import { ItemTable } from '../components/item-table';
import { ItemDetailsDrawer } from '../components/item-details-drawer';
import { getItemColumns } from '../column/item-column';
import { ItemFormDrawer } from '../components/item-form-drawer';
import { ConfirmActionDialog, type ConfirmAction } from '@/components/shared/confirm-action-dialog';
import { Can, useCan } from '@/lib/rbac';

import {
  useListCategories,
  useListItems,
  useListItemUnits,
} from '../../category/hooks/useCategoryQueries';
import {
  useDeactivateItem,
  useReactivateItem,
  useRemoveItemImage,
} from '../../category/hooks/useCategoryMutations';
import type { ItemResponse, ListItemsQuery } from '../types';
import { ChangePriceDialog } from '../components/change-price-dialog';
import { RecordMovementDrawer } from '../../stock/components/record-movement-drawer';
import { ItemImageDialog } from '../components/item-image-dialog';
import { getImageErrorMessage } from '../../category/lib/item-image';

const PAGE_SIZE = 25;

const FILTER_PARAM = {
  q: 'q',
  active: 'active',
  category_id: 'category_id',
  low_stock: 'low_stock',
} as const;

type FormMode = 'add' | 'edit';

const confirmCopy = {
  deactivate: 'Item deactivated',
  reactivate: 'Item reactivated',
  removeImage: 'Image removed',
} as const;

function readItemFilters(params: URLSearchParams): ItemFilters {
  const active = params.get('active');
  const lowStock = params.get('low_stock');

  return {
    q: params.get('q') ?? '',
    active: active === 'true' || active === 'false' ? active : '',
    category_id: params.get('category_id') ?? '',
    low_stock: lowStock === 'true' || lowStock === 'false' ? lowStock : '',
  };
}

export function ItemPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);
  const [priceTarget, setPriceTarget] = useState<ItemResponse | null>(null);
  const [stockTarget, setStockTarget] = useState<ItemResponse | null>(null);
  const [imageTarget, setImageTarget] = useState<ItemResponse | null>(null);

  const [formMode, setFormMode] = useState<FormMode>('add');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<{
    item: ItemResponse;
    action: ConfirmAction;
  } | null>(null);

  const filters = useMemo(() => readItemFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);

  const hasActiveFilters = Boolean(
    filters.q.trim() || filters.active || filters.category_id || filters.low_stock,
  );

  const params = useMemo<ListItemsQuery>(
    () => ({
      page,
      page_size: PAGE_SIZE,
      ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
      ...(filters.active !== '' ? { active: filters.active === 'true' } : {}),
      ...(filters.category_id ? { category_id: filters.category_id } : {}),
      ...(filters.low_stock !== '' ? { low_stock: filters.low_stock === 'true' } : {}),
    }),
    [page, filters],
  );

  const { data, isLoading, isFetching, isError, refetch } = useListItems(params);
  const { data: categoryData } = useListCategories({ page: 1, page_size: 100 });
  const { data: units } = useListItemUnits();

  const deactivateItem = useDeactivateItem();
  const reactivateItem = useReactivateItem();
  const removeImage = useRemoveItemImage();

  const canEdit = useCan('itemEdit');
  const canChangePrice = useCan('itemChangePrice');
  const canRecordStock = useCan('stockRecord');
  const canViewStock = useCan('stockView');
  const canChangeImage = useCan('itemImage');
  const canDeactivate = useCan('itemDeactivate');
  const canReactivate = useCan('itemReactivate');
  const itemPermissions = useMemo(
    () => ({
      edit: canEdit,
      changePrice: canChangePrice,
      recordStock: canRecordStock,
      viewStock: canViewStock,
      changeImage: canChangeImage,
      deactivate: canDeactivate,
      reactivate: canReactivate,
    }),
    [
      canEdit,
      canChangePrice,
      canRecordStock,
      canViewStock,
      canChangeImage,
      canDeactivate,
      canReactivate,
    ],
  );

  const items = useMemo(() => data?.data ?? [], [data]);
  const categories = useMemo(() => categoryData?.data ?? [], [categoryData]);
  const unitOptions = useMemo(
    () => (units ?? []).map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) })),
    [units],
  );

  const meta = data?.meta;
  const total = meta?.total ?? items.length;

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'item' : 'items'}${hasActiveFilters ? ' matching filters' : ''}`;

  const handleFiltersChange = useCallback(
    (patch: Partial<ItemFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          for (const [key, value] of Object.entries(patch)) {
            const param = FILTER_PARAM[key as keyof ItemFilters];

            if (value) next.set(param, value);
            else next.delete(param);
          }

          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        Object.values(FILTER_PARAM).forEach((param) => next.delete(param));
        next.delete('page');

        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (nextPage <= 1) next.delete('page');
        else next.set('page', String(nextPage));

        return next;
      });
    },
    [setSearchParams],
  );

  const handleViewItem = useCallback((item: ItemResponse) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  }, []);

  const openAddItem = useCallback(() => {
    setFormMode('add');
    setSelectedItem(null);
    setFormOpen(true);
  }, []);

  const handleEditItem = useCallback((item: ItemResponse) => {
    setFormMode('edit');
    setSelectedItem(item);
    setFormOpen(true);
  }, []);

  const requestDeactivate = useCallback(
    (item: ItemResponse) => setConfirmTarget({ item: item, action: 'deactivate' }),
    [],
  );

  const requestReactivate = useCallback(
    (item: ItemResponse) => setConfirmTarget({ item, action: 'reactivate' }),
    [],
  );
  const requestChangePrice = useCallback((item: ItemResponse) => setPriceTarget(item), []);
  const requestRecordStock = useCallback((item: ItemResponse) => setStockTarget(item), []);

  const requestChangeImage = useCallback((item: ItemResponse) => setImageTarget(item), []);
  const requestRemoveImage = useCallback(
    (item: ItemResponse) => setConfirmTarget({ item, action: 'removeImage' }),
    [],
  );
  const columns = useMemo(
    () =>
      getItemColumns(
        {
          onView: handleViewItem,
          onEdit: handleEditItem,
          onChangePrice: requestChangePrice,
          onRecordStock: requestRecordStock,
          onDeactivate: requestDeactivate,
          onReactivate: requestReactivate,
          onChangeImage: requestChangeImage,
          onRemoveImage: requestRemoveImage,
        },
        categoryNames,
        itemPermissions,
      ),
    [
      handleViewItem,
      handleEditItem,
      requestChangePrice,
      requestRecordStock,
      requestDeactivate,
      requestReactivate,
      categoryNames,
      itemPermissions,
    ],
  );

  useEffect(() => {
    if (meta && meta.total_pages > 0 && page > meta.total_pages) {
      handlePageChange(meta.total_pages);
    }
  }, [meta, page, handlePageChange]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Store Items"
        description="Manage your store's inventory, prices, and stock levels."
        actions={
          <Can permission="itemCreate">
            <Button onClick={openAddItem}>
              <Plus />
              Add New Item
            </Button>
          </Can>
        }
      />

      <ItemFiltersBar
        filters={filters}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load items</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <ItemTable
          columns={columns}
          items={items}
          meta={meta}
          description={description}
          onRowClick={handleViewItem}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage={hasActiveFilters ? 'No items match these filters.' : 'No items found.'}
        />
      )}

      <ItemDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        item={selectedItem}
        categoryName={
          selectedItem?.category_id ? categoryNames[selectedItem.category_id] : undefined
        }
      />

      <ItemFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        item={selectedItem}
        units={unitOptions}
        categories={categories}
        onSuccess={() => refetch()}
        onChangePrice={requestChangePrice}
        onRecordStock={requestRecordStock}
        onToggleStatus={(item: ItemResponse) =>
          item.active ? requestDeactivate(item) : requestReactivate(item)
        }
      />

      <ChangePriceDialog
        item={priceTarget}
        open={!!priceTarget}
        onOpenChange={(open) => !open && setPriceTarget(null)}
        onSuccess={(updated) => {
          setSelectedItem((prev) => (prev?.id === updated.id ? updated : prev));
        }}
      />

      <RecordMovementDrawer
        open={!!stockTarget}
        onOpenChange={(open) => !open && setStockTarget(null)}
        initialItem={stockTarget}
        onSuccess={() => refetch()}
      />

      <ItemImageDialog
        item={imageTarget}
        open={!!imageTarget}
        onOpenChange={(open) => !open && setImageTarget(null)}
        onSuccess={() => refetch()}
      />

      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        action={confirmTarget?.action}
        entityId={confirmTarget?.item.id ?? null}
        entityName={confirmTarget?.item.name}
        entityLabel={confirmTarget?.action === 'removeImage' ? 'image' : 'item'}
        onConfirm={async (id) => {
          switch (confirmTarget?.action) {
            case 'reactivate':
              return await reactivateItem.mutateAsync(id);
            case 'removeImage':
              try {
                return await removeImage.mutateAsync(id);
              } catch (err) {
                throw new Error(getImageErrorMessage(err));
              }
            default:
              return await deactivateItem.mutateAsync(id);
          }
        }}
        onSuccess={() => {
          if (confirmTarget) toast.success(confirmCopy[confirmTarget.action]);
        }}
      />
    </div>
  );
}
