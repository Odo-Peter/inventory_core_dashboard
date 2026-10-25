import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldError, FormErrorSummary } from '@/components/states/validation';

describe('FieldError', () => {
  it('renders an alert with the field message and id', () => {
    render(<FieldError id="sku-error">SKU is required</FieldError>);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('SKU is required');
    expect(alert).toHaveAttribute('id', 'sku-error');
  });

  it('renders nothing when there is no message', () => {
    const { container } = render(<FieldError />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('FormErrorSummary', () => {
  it('renders a default title and each error', () => {
    render(<FormErrorSummary errors={['SKU is required', 'Price must be greater than 0']} />);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent('There was a problem with your submission');
    expect(screen.getByText('SKU is required')).toBeInTheDocument();
    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
  });

  it('supports a custom title', () => {
    render(<FormErrorSummary title="Fix these fields" errors={['Name is required']} />);

    expect(screen.getByText('Fix these fields')).toBeInTheDocument();
  });

  it('renders nothing when there are no errors', () => {
    const { container } = render(<FormErrorSummary errors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
