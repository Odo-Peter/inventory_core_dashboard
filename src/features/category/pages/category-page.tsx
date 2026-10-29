import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { CategoryFiltersBar, type CategoryFilters } from '../components/category-filters';
import { CategoryTable } from '../components/category-table';
import { useListCategories } from '../hooks/useCategoryQueries';
import type { CategoryResponse, ListCategoriesQuery } from '../types';
import { getCategoryColumns } from '../column/category-column';
import { CategoryDetailsDrawer } from '../components/category-details-drawer';

const PAGE_SIZE = 25;

const FILTER_PARAM = {
  q: 'q',
  active: 'active',
} as const;

function readCategoryFilters(params: URLSearchParams): CategoryFilters {
  const active = params.get('active');

  return {
    q: params.get('q') ?? '',
    active: active === 'true' || active === 'false' ? active : '',
  };
}

export function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filters = useMemo(() => readCategoryFilters(searchParams), [searchParams]);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);

  const hasActiveFilters = Boolean(filters.q || filters.active);

  const params = useMemo<ListCategoriesQuery>(
    () => ({
      page,
      page_size: PAGE_SIZE,
      ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
      ...(filters.active !== '' ? { active: filters.active === 'true' } : {}),
    }),
    [page, filters],
  );

  const { data, isLoading, isFetching, isError, refetch } = useListCategories(params);

  const categories = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? categories.length;

  const description = isLoading
    ? undefined
    : `${total} ${total === 1 ? 'category' : 'categories'}${
        hasActiveFilters ? ' matching filters' : ''
      }`;

  const handleFiltersChange = useCallback(
    (patch: Partial<CategoryFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          for (const [key, value] of Object.entries(patch)) {
            const param = FILTER_PARAM[key as keyof CategoryFilters];

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

  const handleViewCategory = useCallback((category: CategoryResponse) => {
    setSelectedCategory(category);
    setDetailsOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: CategoryResponse) => {
    // Open your category edit form or drawer.
    //   setSelectedCategory(category);
    //   setEditOpen(true);
  }, []);

  const handleDeactivateCategory = useCallback((category: CategoryResponse) => {
    // Trigger your deactivate mutation or confirmation dialog.
    //   setCategoryToDeactivate(category);
  }, []);

  const handleReactivateCategory = useCallback((category: CategoryResponse) => {
    // Trigger your reactivate mutation or confirmation dialog.
    //   setCategoryToReactivate(category);
  }, []);

  const columns = useMemo(
    () =>
      getCategoryColumns({
        onView: handleViewCategory,
        onEdit: handleEditCategory,
        onDeactivate: handleDeactivateCategory,
        onReactivate: handleReactivateCategory,
      }),
    [handleViewCategory, handleEditCategory, handleDeactivateCategory, handleReactivateCategory],
  );

  useEffect(() => {
    if (meta && meta.total_pages > 0 && page > meta.total_pages) {
      handlePageChange(meta.total_pages);
    }
  }, [meta, page, handlePageChange]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Categories" description="Manage your store's product categories." />

      <CategoryFiltersBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {isError ? (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium">Failed to load categories</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <CategoryTable
          columns={columns}
          categories={categories}
          meta={meta}
          description={description}
          onRowClick={handleViewCategory}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage={
            hasActiveFilters ? 'No categories match these filters.' : 'No categories found.'
          }
        />
      )}

      <CategoryDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        category={selectedCategory}
      />
    </div>
  );
}
