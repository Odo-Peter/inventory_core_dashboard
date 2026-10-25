# States Usage (Quick Examples)

## Loading

```tsx
import { PageLoading, SectionLoading, TableLoading, FormLoading, InlineLoading } from "@/components/states"

<PageLoading />
<SectionLoading lines={3} />
<TableLoading rows={5} columns={6} />
<FormLoading fields={4} />
<InlineLoading text="Saving..." />
```

## Empty

```tsx
import { EmptyState, NoResultsState, ListEmptyState, TableEmptyState } from "@/components/states"
import { Button } from "@/components/ui/button"

<EmptyState title="No products" description="Add your first product." primaryAction={<Button>Add product</Button>} />
<NoResultsState title="No results" description="Try adjusting filters." secondaryAction={<Button variant="outline">Clear filters</Button>} />
<ListEmptyState title="No items" description="Nothing here yet." />
<TableEmptyState title="No products" description="Get started by adding a product." primaryAction={<Button>Add product</Button>} />
```

## Validation

```tsx
import { FieldError, FormErrorSummary } from "@/components/states"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

<FormErrorSummary errors={["SKU is required", "Price must be greater than 0"]} />
<Field label="SKU" htmlFor="sku">
  <Input id="sku" aria-invalid="true" aria-describedby="sku-error" />
</Field>
<FieldError id="sku-error">SKU is required</FieldError>
```

## Network / Request errors

```tsx
import { LoadErrorState, SubmitErrorState, ConnectionErrorState } from "@/components/states"
import { Button } from "@/components/ui/button"

<LoadErrorState title="Failed to load" description="We couldn't load products." onRetry={() => {}} />
<SubmitErrorState title="Save failed" description="Please try again." onRetry={() => {}} />
<ConnectionErrorState title="Connection problem" description="Check your network connection." onRetry={() => {}} />
```

## Access

```tsx
import { UnauthorizedState, PermissionDeniedState } from "@/components/states"
import { Button } from "@/components/ui/button"

<UnauthorizedState title="Sign in required" description="Please sign in to continue." primaryAction={<Button>Sign in</Button>} />
<PermissionDeniedState title="Access denied" description="You don't have permission to view this page." secondaryAction={<Button variant="outline">Go back</Button>} />
```

## Resource

```tsx
import { NotFoundState } from '@/components/states';
import { Button } from '@/components/ui/button';

<NotFoundState
  title="Not found"
  description="This record doesn't exist or was removed."
  primaryAction={<Button>Back to products</Button>}
/>;
```

## Success

```tsx
import { InlineSuccessState } from '@/components/states';

<InlineSuccessState title="Saved" description="Product updated." />;
```
