import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema, type ProductFormValues } from './product-form.schema';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/states/validation';

export function ProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      stock: 0,
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    console.log('product-form-values', values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Field label="Name" htmlFor="name" required>
        <Input
          id="name"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        <FieldError id="name-error">{errors.name?.message}</FieldError>
      </Field>

      <Field label="SKU" htmlFor="sku" required>
        <Input
          id="sku"
          {...register('sku')}
          aria-invalid={!!errors.sku}
          aria-describedby={errors.sku ? 'sku-error' : undefined}
        />
        <FieldError id="sku-error">{errors.sku?.message}</FieldError>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price" htmlFor="price" required>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price')}
            aria-invalid={!!errors.price}
            aria-describedby={errors.price ? 'price-error' : undefined}
          />
          <FieldError id="price-error">{errors.price?.message}</FieldError>
        </Field>
        <Field label="Stock" htmlFor="stock" required>
          <Input
            id="stock"
            type="number"
            {...register('stock')}
            aria-invalid={!!errors.stock}
            aria-describedby={errors.stock ? 'stock-error' : undefined}
          />
          <FieldError id="stock-error">{errors.stock?.message}</FieldError>
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
