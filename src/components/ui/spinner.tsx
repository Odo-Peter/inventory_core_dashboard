import * as React from 'react';

import { cn } from 'cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'border-muted border-t-foreground inline-block h-4 w-4 animate-spin rounded-full border-2',
        className,
      )}
      {...props}
    />
  );
}
