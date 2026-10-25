import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InlineSuccessState } from '@/components/states/success';

describe('InlineSuccessState', () => {
  it('renders a polite status message', () => {
    render(<InlineSuccessState title="Saved" description="Product updated." />);

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Saved');
    expect(status).toHaveTextContent('Product updated.');
  });

  it('renders a default title', () => {
    render(<InlineSuccessState />);

    expect(screen.getByRole('status')).toHaveTextContent('Success');
  });
});
