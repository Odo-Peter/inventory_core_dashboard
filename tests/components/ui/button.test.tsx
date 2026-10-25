import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('fires onClick when pressed', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save changes</Button>);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Save changes
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies classes for the selected variant', () => {
    render(<Button variant="outline">Outline</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-background');
    expect(screen.getByRole('button')).toHaveClass('border-border');
  });

  it('applies classes for the selected size', () => {
    render(<Button size="lg">Large</Button>);

    expect(screen.getByRole('button')).toHaveClass('h-9');
  });
});
