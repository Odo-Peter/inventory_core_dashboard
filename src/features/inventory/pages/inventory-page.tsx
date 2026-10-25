import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/features/inventory/forms/product-form';

export function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory" description="Products" actions={<Button>Add product</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border-border bg-card rounded-lg border p-4">
          <div className="mb-3 flex flex-col gap-1">
            <p className="text-sm font-medium">Add product (example)</p>
            <p className="text-muted-foreground text-xs">RHF + Zod pattern</p>
          </div>
          <ProductForm />
        </div>
        <div className="border-border bg-card rounded-lg border p-4">
          <p className="text-sm">Product list placeholder</p>
          <p className="text-muted-foreground text-xs">Use Table/DataTable here.</p>
        </div>
      </div>
    </div>
  );
}
