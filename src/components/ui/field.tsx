import * as React from 'react';

import { cn } from 'cn';
import { Label } from '@/components/ui/label';

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  required?: boolean;
}

export function Field({
  label,
  htmlFor,
  error,
  helpText,
  required,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label ? (
        <Label
          htmlFor={htmlFor}
          className={cn(required && "after:text-destructive after:ml-0.5 after:content-['*']")}
        >
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : helpText ? (
        <p className="text-muted-foreground text-xs">{helpText}</p>
      ) : null}
    </div>
  );
}
