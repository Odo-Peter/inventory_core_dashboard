import { useInvalidateAudits } from '@/features/admin/hooks/useAdminMutations';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  createItem,
  deactivateItem,
  updateCategory,
  updateItem,
} from '../services/category.service';
import type { CategoryFormInput, CategoryUpdateValues } from '../schemas/category-form.schema';
import type { CreateItemPayload, UpdateItemPayload } from '../../items/types';

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (payload: CategoryFormInput) => createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      invalidateAudits();
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryUpdateValues }) =>
      updateCategory(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
        invalidateAudits(),
      ]);
    },
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => createItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      invalidateAudits();
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) =>
      updateItem(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.items.detail(variables.id),
      });
      invalidateAudits();
    },
  });
};

export const useDeactivateItem = () => {
  const queryClient = useQueryClient();
  const invalidateAudits = useInvalidateAudits();

  return useMutation({
    mutationFn: (id: string) => deactivateItem(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
      invalidateAudits();
    },
  });
};
