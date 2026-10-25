import * as React from 'react';

import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export interface BaseErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

function BaseErrorState({
  title,
  description,
  detail,
  icon,
  primaryAction,
  secondaryAction,
  onRetry,
  retryLabel = 'Retry',
  className,
  ...props
}: BaseErrorStateProps) {
  const actions =
    primaryAction || secondaryAction || onRetry ? (
      <div className="flex items-center gap-2">
        {primaryAction}
        {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
        {secondaryAction}
      </div>
    ) : undefined;

  return (
    <div
      role="alert"
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
        {detail ? <p className="text-muted-foreground text-xs">{detail}</p> : null}
      </div>
      {actions ? <div className="mt-1">{actions}</div> : null}
    </div>
  );
}

export interface LoadErrorStateProps extends BaseErrorStateProps {}

export function LoadErrorState(props: LoadErrorStateProps) {
  return <BaseErrorState {...props} />;
}

export interface SubmitErrorStateProps extends BaseErrorStateProps {}

export function SubmitErrorState(props: SubmitErrorStateProps) {
  return <BaseErrorState {...props} />;
}

export interface ConnectionErrorStateProps extends BaseErrorStateProps {}

export function ConnectionErrorState(props: ConnectionErrorStateProps) {
  return <BaseErrorState {...props} />;
}
