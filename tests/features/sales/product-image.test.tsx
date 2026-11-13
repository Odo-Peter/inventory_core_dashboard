import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductImage } from '@/features/sales/components/product-image';

describe('ProductImage', () => {
  it('shows a placeholder when the item has no image', () => {
    render(<ProductImage alt="Coca-Cola 50cl" />);

    expect(screen.getByRole('img', { name: 'No image for Coca-Cola 50cl' })).toBeInTheDocument();
    expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
  });

  it('shows a placeholder when the variants contain no usable image', () => {
    render(<ProductImage variants={{ medium: '/medium.jpg' }} alt="Coca-Cola 50cl" />);

    expect(screen.getByRole('img', { name: 'No image for Coca-Cola 50cl' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Coca-Cola 50cl' })).not.toBeInTheDocument();
  });

  it('renders the preferred image variant with the item name as alt text', () => {
    render(
      <ProductImage variants={{ thumb: '/thumb.jpg', full: '/full.jpg' }} alt="Coca-Cola 50cl" />,
    );

    const image = screen.getByRole('img', { name: 'Coca-Cola 50cl' });
    expect(image.tagName).toBe('IMG');
    expect(image).toHaveAttribute('src', '/thumb.jpg');
  });

  it('falls back to the full image when a thumb is not available', () => {
    render(<ProductImage variants={{ full: '/full.jpg' }} alt="Fanta 50cl" />);

    expect(screen.getByRole('img', { name: 'Fanta 50cl' })).toHaveAttribute('src', '/full.jpg');
  });

  it('swaps to the placeholder when the image fails to load', () => {
    render(<ProductImage variants={{ thumb: '/broken.jpg' }} alt="Fanta 50cl" />);

    fireEvent.error(screen.getByRole('img', { name: 'Fanta 50cl' }));

    expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Fanta 50cl' })).not.toBeInTheDocument();
  });

  it('retries the image when the source changes', () => {
    const { rerender } = render(
      <ProductImage variants={{ thumb: '/broken.jpg' }} alt="Fanta 50cl" />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Fanta 50cl' }));
    expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();

    rerender(<ProductImage variants={{ thumb: '/fixed.jpg' }} alt="Fanta 50cl" />);

    expect(screen.getByRole('img', { name: 'Fanta 50cl' })).toHaveAttribute('src', '/fixed.jpg');
  });
});
