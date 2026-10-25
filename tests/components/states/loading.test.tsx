import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FormLoading,
  InlineLoading,
  PageLoading,
  SectionLoading,
  TableLoading,
} from '@/components/states/loading';

describe('PageLoading', () => {
  it('renders a live status region with a spinner and default text', () => {
    render(<PageLoading />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<PageLoading title="Loading products" />);

    expect(screen.getByText('Loading products')).toBeInTheDocument();
  });
});

describe('SectionLoading', () => {
  it('renders a header skeleton and the requested number of line skeletons', () => {
    const { container } = render(<SectionLoading lines={2} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });
});

describe('TableLoading', () => {
  it('renders the requested number of rows and columns', () => {
    const { container } = render(<TableLoading rows={2} columns={3} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(9);
  });
});

describe('FormLoading', () => {
  it('renders two skeletons per requested field', () => {
    const { container } = render(<FormLoading fields={3} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
  });
});

describe('InlineLoading', () => {
  it('renders a compact spinner with optional text', () => {
    render(<InlineLoading text="Saving..." />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
