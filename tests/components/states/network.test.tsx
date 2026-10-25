import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ConnectionErrorState,
  LoadErrorState,
  SubmitErrorState,
} from '@/components/states/network';
import { Button } from '@/components/ui/button';

describe('LoadErrorState', () => {
  it('renders the message and an optional detail', () => {
    render(
      <LoadErrorState
        title="Could not load products"
        description="Please try again."
        detail="Request ID: abc123"
      />,
    );

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Could not load products');
    expect(alert).toHaveTextContent('Please try again.');
    expect(alert).toHaveTextContent('Request ID: abc123');
  });

  it('calls onRetry when the retry button is pressed', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<LoadErrorState title="Could not load" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('supports a custom retry label', () => {
    render(<LoadErrorState title="Could not load" onRetry={vi.fn()} retryLabel="Try again" />);

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('SubmitErrorState', () => {
  it('renders primary and secondary actions', () => {
    render(
      <SubmitErrorState
        title="Could not save"
        description="Your changes were not saved."
        primaryAction={<Button>Try again</Button>}
        secondaryAction={<Button variant="outline">Cancel</Button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});

describe('ConnectionErrorState', () => {
  it('renders a connection message and retry action', () => {
    render(<ConnectionErrorState title="You are offline" onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('You are offline');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
