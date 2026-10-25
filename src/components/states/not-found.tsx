import * as React from 'react';

import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export interface NotFoundStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function NotFoundState({
  title = 'Not found',
  description = "The record or page you're looking for doesn't exist or was removed.",
  icon,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: NotFoundStateProps) {
  const actions =
    primaryAction || secondaryAction ? (
      <div className="flex items-center gap-2">
        {primaryAction}
        {secondaryAction}
      </div>
    ) : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-border flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center',
        className,
      )}
      {...props}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
      {actions ? <div className="mt-1">{actions}</div> : null}
    </div>
  );
}
