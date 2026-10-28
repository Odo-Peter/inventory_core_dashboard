import { createColumnHelper } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableFeatures } from '@/components/shared/data-table';

interface Product {
  id: string;
  name: string;
  stock: number;
}

const columnHelper = createColumnHelper<DataTableFeatures, Product>();

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: 'Product',
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.accessor('stock', {
    header: 'Stock',
    cell: (info) => info.getValue(),
  }),
]);

const products: Product[] = [
  { id: '1', name: 'A4 Paper', stock: 24 },
  { id: '2', name: 'Stapler', stock: 3 },
];

describe('DataTable', () => {
  it('renders column headers and cell values from data', () => {
    render(<DataTable columns={columns} data={products} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByText('A4 Paper')).toBeInTheDocument();
    expect(screen.getByText('Stapler')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading', () => {
    const { container } = render(<DataTable columns={columns} data={products} isLoading />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('A4 Paper')).not.toBeInTheDocument();
  });

  it('renders a custom loading state when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={products}
        isLoading
        loadingState={<p>Fetching products...</p>}
      />,
    );

    expect(screen.getByText('Fetching products...')).toBeInTheDocument();
    expect(screen.queryByText('A4 Paper')).not.toBeInTheDocument();
  });

  it('shows the empty state without table headers when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyState={<p>No products found</p>} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps table headers when persistHeaders is set and data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        persistHeaders
        emptyState={<p>No products found</p>}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('renders pagination details and calls onPageChange', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={products}
        page={2}
        pageCount={3}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    const { rerender } = render(
      <DataTable columns={columns} data={products} page={1} pageCount={3} />,
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();

    rerender(<DataTable columns={columns} data={products} page={3} pageCount={3} />);

    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('disables both pagination buttons while isFetching', () => {
    render(<DataTable columns={columns} data={products} page={2} pageCount={3} isFetching />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('applies the refetching opacity class only when isFetching and not isLoading', () => {
    const { container, rerender } = render(
      <DataTable columns={columns} data={products} isFetching />,
    );

    const dimmedWrapper = container.querySelector('.opacity-60');
    expect(dimmedWrapper).toBeInTheDocument();
    expect(dimmedWrapper).toHaveClass('transition-opacity');

    rerender(<DataTable columns={columns} data={products} isFetching isLoading />);

    expect(container.querySelector('.opacity-60')).not.toBeInTheDocument();
  });

  it('calls onRowClick with the original row data', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(<DataTable columns={columns} data={products} onRowClick={onRowClick} />);

    await user.click(screen.getByText('A4 Paper'));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(products[0]);
  });

  it('does not trigger onRowClick for actions that stop propagation', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onAction = vi.fn();

    const actionColumns = columnHelper.columns([
      ...columns,
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAction(row.original);
            }}
          >
            Open {row.original.name}
          </button>
        ),
      }),
    ]);

    render(<DataTable columns={actionColumns} data={products} onRowClick={onRowClick} />);

    await user.click(screen.getByRole('button', { name: 'Open A4 Paper' }));

    expect(onAction).toHaveBeenCalledWith(products[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders custom header content when headers and headerProps are provided', () => {
    render(
      <DataTable
        columns={columns}
        data={products}
        headers
        headerProps={() => <h2>Inventory products</h2>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Inventory products' })).toBeInTheDocument();
  });

  it('forwards meta to the table instance for use by custom cells', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();

    const metaColumns = columnHelper.columns([
      columnHelper.accessor('name', { header: 'Product' }),
      columnHelper.display({
        id: 'view',
        header: 'Actions',
        cell: ({ row, table }) => {
          const tableMeta = table.options.meta as
            { onView?: (product: Product) => void } | undefined;

          return (
            <button onClick={() => tableMeta?.onView?.(row.original)}>
              View {row.original.name}
            </button>
          );
        },
      }),
    ]);

    render(<DataTable columns={metaColumns} data={products} meta={{ onView }} />);

    await user.click(screen.getByRole('button', { name: 'View A4 Paper' }));

    expect(onView).toHaveBeenCalledWith(products[0]);
  });

  it('debounces search changes', () => {
    vi.useFakeTimers();

    try {
      const onSearchChange = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={products}
          showSearch
          searchValue=""
          onSearchChange={onSearchChange}
        />,
      );

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'stapler' } });

      expect(onSearchChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(onSearchChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onSearchChange).toHaveBeenCalledWith('stapler');
      expect(onSearchChange).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('syncs the search input when the parent resets searchValue', async () => {
    const onSearchChange = vi.fn();

    const { rerender } = render(
      <DataTable
        columns={columns}
        data={products}
        showSearch
        searchValue="paper"
        onSearchChange={onSearchChange}
      />,
    );

    const searchbox = screen.getByRole('searchbox');
    expect(searchbox).toHaveValue('paper');

    rerender(
      <DataTable
        columns={columns}
        data={products}
        showSearch
        searchValue=""
        onSearchChange={onSearchChange}
      />,
    );

    await waitFor(() => expect(searchbox).toHaveValue(''));
  });
});
