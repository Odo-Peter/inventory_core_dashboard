import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from '@/components/shared/data-table';

interface Product {
  id: string;
  name: string;
  stock: number;
}

const columns = [
  {
    key: 'name',
    header: 'Product',
    cell: (product: Product) => <span>{product.name}</span>,
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right' as const,
    cell: (product: Product) => product.stock,
  },
];

const products: Product[] = [
  { id: '1', name: 'A4 Paper', stock: 24 },
  { id: '2', name: 'Stapler', stock: 3 },
];

describe('DataTable', () => {
  it('renders column headers and row data', () => {
    render(<DataTable columns={columns} data={products} getRowKey={(product) => product.id} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByText('A4 Paper')).toBeInTheDocument();
    expect(screen.getByText('Stapler')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies column alignment classes', () => {
    render(<DataTable columns={columns} data={products} getRowKey={(product) => product.id} />);

    expect(screen.getByRole('columnheader', { name: 'Stock' })).toHaveClass('text-right');
    expect(screen.getByText('24').closest('td')).toHaveClass('text-right');
  });

  it('renders the empty slot when there is no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={(product) => product.id}
        empty={<p>No products found</p>}
      />,
    );

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
