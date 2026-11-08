import { useEffect, useState } from 'react';
import { ImageOffIcon } from 'lucide-react';

import type { ImageVariantUrls } from '@/features/inventory/items/types';
import { cn } from '@/lib/utils';

import { productImageUrl } from '../utils';

interface ProductImageProps {
  variants?: ImageVariantUrls | null;
  alt: string;
  className?: string;
}

/**
 * Renders the best available product image variant, with a placeholder when the
 * item has no image or the image fails to load.
 */
export function ProductImage({ variants, alt, className }: ProductImageProps) {
  const src = productImageUrl(variants);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`No image for ${alt}`}
        data-testid="product-image-placeholder"
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center overflow-hidden',
          className,
        )}
      >
        <ImageOffIcon aria-hidden="true" className="size-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
