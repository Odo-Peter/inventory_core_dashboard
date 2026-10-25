import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  EmptyState,
  ListEmptyState,
  NoResultsState,
  TableEmptyState,
} from '@/components/states/empty';
import { Button } from '@/components/ui/button';

describe('EmptyState', () => {
  it('renders a title and description', () => {
    render(<EmptyState title="No products" description="Add your first product to get started." />);

    expect(screen.getByText('No products')).toBeInTheDocument();
    expect(screen.getByText('Add your first product to get started.')).toBeInTheDocument();
  });

  it('renders primary and secondary actions', () => {
    render(
      <EmptyState
        title="No products"
        primaryAction={<Button>Add product</Button>}
        secondaryAction={<Button variant="outline">Import</Button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add product' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
  });

  it('renders no actions when none are provided', () => {
    render(<EmptyState title="No products" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('NoResultsState', () => {
  it('renders search guidance', () => {
    render(<NoResultsState title="No results" description="Try adjusting your filters." />);

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });
});

describe('ListEmptyState', () => {
  it('renders a list empty message', () => {
    render(<ListEmptyState title="No items" description="Nothing here yet." />);

    expect(screen.getByText('No items')).toBeInTheDocument();
  });
});

describe('TableEmptyState', () => {
  it('renders actions for an empty table', () => {
    render(
      <TableEmptyState
        title="No records"
        description="Create a record to see it here."
        primaryAction={<Button>Create record</Button>}
      />,
    );

    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create record' })).toBeInTheDocument();
  });
});
