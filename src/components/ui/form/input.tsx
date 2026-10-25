import { useState } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // adjust path if needed

import { Field } from '@/components/ui/field';
import { FieldError } from '@/components/states';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  htmlFor?: string;
  error?: boolean;
  errorText?: string;
  isPassword?: boolean;
  Icon?: LucideIcon;
  required?: boolean;
  containerClassName?: string;
}

const Input = ({
  label,
  htmlFor,
  error,
  errorText,
  isPassword = false,
  Icon,
  required,
  containerClassName,
  className,
  type = 'text',
  ...props
}: InputProps) => {
  const [show, setShow] = useState(false);

  const inputType = isPassword ? (show ? 'text' : 'password') : type;
  const inputId = htmlFor ?? props.id;

  return (
    <Field label={label} htmlFor={inputId} required={required} className={containerClassName}>
      <InputGroup className={cn('h-10', error && 'border-destructive')}>
        {Icon && (
          <InputGroupAddon align="inline-start">
            <Icon className="text-muted-foreground size-4" />
          </InputGroupAddon>
        )}

        <InputGroupInput
          {...props}
          id={inputId}
          type={inputType}
          aria-invalid={error}
          aria-describedby={error ? `${htmlFor}-error` : undefined}
          className={className}
        />

        {isPassword && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-sm"
              aria-label={show ? 'Hide' : 'Show'}
              aria-pressed={show}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <FieldError id={`${htmlFor}-error`}>{errorText}</FieldError>
    </Field>
  );
};

export { Input };
