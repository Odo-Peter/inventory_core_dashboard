import * as React from 'react';

import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';

export interface EmptyStateBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: EmptyStateBaseProps) {
  return (
    <Empty
      title={title}
      description={description}
      action={
        primaryAction || secondaryAction ? (
          <div className="flex items-center gap-2">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : undefined
      }
      className={cn(icon && 'gap-3', className)}
      {...props}
    />
  );
}

export interface NoResultsStateProps extends EmptyStateBaseProps {}

export function NoResultsState(props: NoResultsStateProps) {
  return <EmptyState {...props} />;
}

export interface ListEmptyStateProps extends EmptyStateBaseProps {}

export function ListEmptyState(props: ListEmptyStateProps) {
  return <EmptyState {...props} />;
}

export interface TableEmptyStateProps extends Omit<EmptyStateBaseProps, 'icon'> {}

export function TableEmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: TableEmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-8 text-center',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div className="mt-1 flex items-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
