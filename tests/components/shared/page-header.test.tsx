import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

describe('PageHeader', () => {
  it('renders a title and description', () => {
    render(<PageHeader title="Inventory" description="Manage products and stock." />);

    expect(screen.getByRole('heading', { name: 'Inventory', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Manage products and stock.')).toBeInTheDocument();
  });

  it('renders actions', () => {
    render(<PageHeader title="Inventory" actions={<Button>Add product</Button>} />);

    expect(screen.getByRole('button', { name: 'Add product' })).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    render(<PageHeader title="Inventory" className="custom-header" />);

    expect(screen.getByRole('heading', { level: 1 }).closest('header')).toHaveClass(
      'custom-header',
    );
  });
});
