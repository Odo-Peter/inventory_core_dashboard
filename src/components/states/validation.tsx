import * as React from 'react';

import { cn } from 'cn';

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
}

export function FieldError({ className, children, id, ...props }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn('text-destructive text-xs', className)} {...props}>
      {children}
    </p>
  );
}

export interface FormErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: string[];
  title?: string;
}

export function FormErrorSummary({
  errors = [],
  title = 'There was a problem with your submission',
  className,
  ...props
}: FormErrorSummaryProps) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'border-destructive/40 bg-destructive/5 text-foreground rounded-lg border px-3 py-2',
        className,
      )}
      {...props}
    >
      <p className="text-sm font-medium">{title}</p>
      <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs">
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
