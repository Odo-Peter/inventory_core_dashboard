import * as React from 'react';

import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

export interface PageLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function PageLoading({ title = 'Loading', className, ...props }: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[40vh] w-full flex-col items-center justify-center gap-2',
        className,
      )}
      {...props}
    >
      <Spinner />
      <p className="text-muted-foreground text-xs">{title}</p>
    </div>
  );
}

export interface SectionLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SectionLoading({ lines = 3, className, ...props }: SectionLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export interface TableLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export function TableLoading({ rows = 5, columns = 6, className, ...props }: TableLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('border-border bg-card overflow-hidden rounded-lg border', className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-3 py-2 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-border border-b last:border-0">
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-3 py-2">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface FormLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  fields?: number;
}

export function FormLoading({ fields = 4, className, ...props }: FormLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export interface InlineLoadingProps extends React.HTMLAttributes<HTMLSpanElement> {
  text?: string;
}

export function InlineLoading({ text, className, ...props }: InlineLoadingProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 text-xs', className)}
      {...props}
    >
      <Spinner className="h-3.5 w-3.5" />
      {text ? <span className="text-muted-foreground">{text}</span> : null}
    </span>
  );
}
