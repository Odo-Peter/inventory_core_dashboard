import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Loading } from '@/components/shared/loading';

describe('Loading', () => {
  it('renders a spinner by default', () => {
    render(<Loading />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders optional text with the spinner', () => {
    render(<Loading text="Loading products..." />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('renders skeleton placeholders when requested', () => {
    const { container } = render(<Loading variant="skeleton" />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(<Loading className="custom-loading" />);

    expect(container.firstChild).toHaveClass('custom-loading');
  });
});
