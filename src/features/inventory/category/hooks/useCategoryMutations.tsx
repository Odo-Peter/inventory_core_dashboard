import { useInvalidateAudits } from '@/features/admin/hooks/useAdminMutations';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '../services/category.service';
import type { CategoryFormInput, CategoryUpdateValues } from '../schemas/category-form.schema';

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
