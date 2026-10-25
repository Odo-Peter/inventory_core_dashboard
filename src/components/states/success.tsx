import * as React from 'react';

import { cn } from 'cn';

export interface InlineSuccessStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: React.ReactNode;
}

export function InlineSuccessState({
  title = 'Success',
  description,
  className,
  ...props
}: InlineSuccessStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('border-border rounded-lg border px-3 py-2', className)}
      {...props}
    >
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
    </div>
  );
}
