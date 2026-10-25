import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

describe('EmptyState', () => {
  it('renders a title and description', () => {
    render(<EmptyState title="No products" description="Add a product to get started." />);

    expect(screen.getByText('No products')).toBeInTheDocument();
    expect(screen.getByText('Add a product to get started.')).toBeInTheDocument();
  });

  it('renders an action', () => {
    render(<EmptyState title="No products" action={<Button>Add product</Button>} />);

    expect(screen.getByRole('button', { name: 'Add product' })).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(<EmptyState title="No products" className="custom-empty" />);

    expect(container.firstChild).toHaveClass('custom-empty');
  });
});
