import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyProfile } from '@/features/auth/hooks/useAuthQueries';
import {
  useListCategories,
  useListItems,
} from '@/features/inventory/category/hooks/useCategoryQueries';
import type { ItemResponse, ListItemsQuery } from '@/features/inventory/items/types';

import { CartBar } from '../components/cart-bar';
import { CheckoutDrawer } from '../components/checkout-drawer';
import { ItemSaleDrawer } from '../components/item-sale-drawer';
import { ProductTile } from '../components/product-tile';
import { ReceiptDialog } from '../components/receipt-dialog';

import { useCart } from '../hooks/useCart';
import { useBarcodeLookup } from '../hooks/useSalesQueries';
import { usePrintSaleReceipt } from '../hooks/useSalesMutations';
import { useAuth } from '@/features/auth/hooks/useAuth';

import type { ReceiptResponse, Sale } from '../types';
import { getSaleErrorInfo } from '../utils';
import { StartShiftDialog } from '@/features/shifts/components/start-shift-dialog';

const PAGE_SIZE = 40;

function readFilters(params: URLSearchParams) {
  return {
    q: params.get('q') ?? '',
    category_id: params.get('category_id') ?? '',
  };
}

export function NewSalePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const [search, setSearch] = useState(filters.q);
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [startShiftOpen, setStartShiftOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const cart = useCart();
  const lookupBarcode = useBarcodeLookup();
  const printReceipt = usePrintSaleReceipt();
  const { data: profile } = useMyProfile();
  const { staff } = useAuth();

  const { data: categoryData } = useListCategories({ page: 1, page_size: 100, active: true });
  const categories = useMemo(() => categoryData?.data ?? [], [categoryData]);

  const query = useMemo<ListItemsQuery>(
    () => ({
      page: 1,
      page_size: PAGE_SIZE,
      active: true,
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.category_id ? { category_id: filters.category_id } : {}),
    }),
    [filters],
  );

  const { data, isLoading, isFetching, isError, refetch } = useListItems({
    ...query,
    include_image_urls: true,
  });

  const items = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta.total ?? items.length;

  const updateParam = useCallback(
    (key: 'q' | 'category_id', value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Keep the local input in sync when the URL changes (back/forward, barcode miss).
  useEffect(() => setSearch(filters.q), [filters.q]);

  // Debounce typed searches into the URL so the items query only runs once.
  useEffect(() => {
    if (search === filters.q) return;
    const timeout = setTimeout(() => updateParam('q', search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search, filters.q, updateParam]);

  const noShift = Boolean(profile && !profile.active_shift_id);

  const openItem = (item: ItemResponse) => {
    setSelectedItem(item);
    setItemDrawerOpen(true);
  };

  const handleSearchKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const barcode = search.trim();
    if (!barcode) return;

    try {
      const item = await lookupBarcode.mutateAsync(barcode);

      if (!item.active) {
        toast.error('That item is inactive and cannot be sold.');
        return;
      }
      if (item.stock_quantity <= 0) {
        toast.error('That item is out of stock.');
        return;
      }

      openItem(item);
    } catch (error) {
      const info = getSaleErrorInfo(error);
      if (info.code === 'item_not_found') {
        // Not a barcode: keep the text as a normal product search.
        updateParam('q', barcode);
      } else {
        toast.error(info.message);
      }
    }
  };

  const handleAddToCart = (item: ItemResponse, quantity: number) => {
    if (cart.quantityFor(item.id) > 0) cart.setQuantity(item.id, quantity);
    else cart.add(item, quantity);
    toast.success(`${item.name} added to cart`);
  };

  const refreshItems = useCallback(async () => {
    const result = await refetch();
    return result.data?.data;
  }, [refetch]);

  const handleCompleted = async (sale: Sale) => {
    cart.clear();
    setCheckoutOpen(false);

    // A sale decrements stock, so the grid must show the new quantities.
    await refetch();

    try {
      const printed = await printReceipt.mutateAsync(sale.id);
      setReceipt(printed);
      setReceiptOpen(true);
    } catch {
      toast.error('Sale recorded, but the receipt could not be prepared.');
    }
  };

  const activeCategory = filters.category_id;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <PageHeader
        title="New Sale"
        description="Tap a product to add it to the cart, or scan a barcode."
      />

      {noShift ? (
        <div
          role="status"
          className="border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <p className="font-medium">Clock in to start selling</p>
          <p className="text-xs">Open a shift from the dashboard before completing a sale.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={searchRef}
            id="sale-product-search"
            type="search"
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products..."
            aria-label="Search products or scan a barcode"
            className="pl-9"
            containerClassName="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Product categories">
          <Button
            type="button"
            size="sm"
            variant={activeCategory ? 'outline' : 'default'}
            aria-pressed={!activeCategory}
            onClick={() => updateParam('category_id', '')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={activeCategory === category.id ? 'default' : 'outline'}
              aria-pressed={activeCategory === category.id}
              onClick={() => updateParam('category_id', category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {!isLoading ? (
          <p className="text-muted-foreground text-xs" data-testid="product-count">
            Showing {items.length} of {total} {total === 1 ? 'item' : 'items'}
            {total > items.length ? '. Narrow your search to see more.' : '.'}
          </p>
        ) : null}
      </div>

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-10 text-center">
          <p className="text-sm font-medium">Failed to load products</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="bg-card overflow-hidden rounded-lg border">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="flex flex-col gap-2 p-3">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-12 text-center">
          <p className="text-sm font-medium">No products found</p>
          <p className="text-muted-foreground text-xs">
            Try a different search or choose another category.
          </p>
          {filters.q || activeCategory ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSearchParams(new URLSearchParams(), { replace: true });
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          data-testid="product-grid"
        >
          {items.map((item) => (
            <ProductTile key={item.id} item={item} onSelect={openItem} />
          ))}
        </div>
      )}

      <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
        <CartBar
          count={cart.count}
          total={cart.total}
          disabled={noShift}
          disabledReason={noShift ? 'Clock in before making a sale' : undefined}
          onCheckout={() => setCheckoutOpen(true)}
          onStart={() => setStartShiftOpen(true)}
        />
      </div>

      <ItemSaleDrawer
        open={itemDrawerOpen}
        onOpenChange={setItemDrawerOpen}
        item={selectedItem}
        cartQuantity={selectedItem ? cart.quantityFor(selectedItem.id) : 0}
        onConfirm={handleAddToCart}
      />

      <CheckoutDrawer
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        lines={cart.lines}
        total={cart.total}
        checkoutDisabled={noShift}
        disabledReason="Clock in before making a sale"
        onSetQuantity={cart.setQuantity}
        onRemove={cart.remove}
        onRefreshItems={refreshItems}
        onSyncItems={cart.syncItems}
        onCompleted={handleCompleted}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receipt}
        onNewSale={() => {
          setReceipt(null);
          searchRef.current?.focus();
        }}
      />

      {profile && (
        <StartShiftDialog
          open={startShiftOpen}
          onOpenChange={setStartShiftOpen}
          profile={profile}
          isLoading={isLoading}
          store={staff?.store_name ?? 'Main Store'}
        />
      )}
    </div>
  );
}
