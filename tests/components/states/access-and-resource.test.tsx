import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermissionDeniedState, UnauthorizedState } from '@/components/states/access';
import { NotFoundState } from '@/components/states/not-found';
import { Button } from '@/components/ui/button';

describe('UnauthorizedState', () => {
  it('renders a sign-in prompt with actions', () => {
    render(
      <UnauthorizedState
        title="Sign in required"
        description="Please sign in to continue."
        primaryAction={<Button>Sign in</Button>}
        secondaryAction={<Button variant="outline">Go back</Button>}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Sign in required');
    expect(screen.getByRole('status')).toHaveTextContent('Please sign in to continue.');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });
});

describe('PermissionDeniedState', () => {
  it('renders a calm permission message without actions', () => {
    render(
      <PermissionDeniedState
        title="Access denied"
        description="You do not have permission to view this page."
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Access denied');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('NotFoundState', () => {
  it('renders the default not-found copy', () => {
    render(<NotFoundState />);

    expect(screen.getByRole('status')).toHaveTextContent('Not found');
    expect(screen.getByRole('status')).toHaveTextContent(
      "The record or page you're looking for doesn't exist or was removed.",
    );
  });

  it('supports a custom title and actions', () => {
    render(
      <NotFoundState
        title="Product not found"
        description="It may have been deleted."
        primaryAction={<Button>Back to products</Button>}
      />,
    );

    expect(screen.getByText('Product not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to products' })).toBeInTheDocument();
  });
});
