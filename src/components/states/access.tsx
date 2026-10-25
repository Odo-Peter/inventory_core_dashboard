import * as React from 'react';

import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export interface AccessStateBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

function AccessStateBase({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: AccessStateBaseProps) {
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

export interface UnauthorizedStateProps extends AccessStateBaseProps {}

export function UnauthorizedState(props: UnauthorizedStateProps) {
  return <AccessStateBase {...props} />;
}

export interface PermissionDeniedStateProps extends AccessStateBaseProps {}

export function PermissionDeniedState(props: PermissionDeniedStateProps) {
  return <AccessStateBase {...props} />;
}
