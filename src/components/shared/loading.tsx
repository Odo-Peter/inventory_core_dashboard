import * as React from 'react';

import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'skeleton' | 'spinner';
  text?: string;
}

export function Loading({ variant = 'spinner', text, className, ...props }: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <Spinner />
      {text ? <span className="text-muted-foreground text-xs">{text}</span> : null}
    </div>
  );
}
