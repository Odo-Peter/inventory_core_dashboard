import { useEffect, useRef, useState } from 'react';
import PhoneInputLib from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Field } from '@/components/ui/field';
import { FieldError } from '@/components/states';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';

// Handle CJS default-export interop (Vite can hand back { default: Component })
const ReactPhoneInput = ((PhoneInputLib as unknown as { default?: typeof PhoneInputLib }).default ??
  PhoneInputLib) as typeof PhoneInputLib;

export interface CountryData {
  countryCode: string;
  dialCode: string;
  format: string;
  name: string;
}

interface PhoneInputProps {
  label?: string;
  htmlFor?: string;
  value: string;
  onChange: (value: string, country: CountryData) => void;
  country?: string;
  placeholder?: string;
  error?: boolean;
  errorText?: string;
  Icon?: LucideIcon;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
  lockCountry?: boolean;
  onBlur?: () => void;
}

const PhoneInputField = ({
  label,
  htmlFor,
  value,
  onChange,
  country = 'ng',
  placeholder = '+23480123456789',
  error,
  errorText,
  Icon,
  required,
  disabled,
  containerClassName,
  className,
  lockCountry,
  onBlur,
}: PhoneInputProps) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>();

  // Keep the country dropdown exactly as wide as the field
  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;

    const update = () => setDropdownWidth(el.getBoundingClientRect().width);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Field label={label} htmlFor={htmlFor} required={required} className={containerClassName}>
      <InputGroup
        ref={groupRef}
        className={cn(
          'h-10 overflow-visible',
          error && 'border-destructive',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
      >
        {Icon && (
          <InputGroupAddon align="inline-start">
            <Icon className="text-muted-foreground size-4" />
          </InputGroupAddon>
        )}

        <ReactPhoneInput
          country={country}
          value={value}
          onChange={(val, data) => onChange(val, data as CountryData)}
          placeholder={placeholder}
          disabled={disabled}
          enableSearch={!lockCountry}
          disableSearchIcon
          {...(lockCountry && {
            onlyCountries: [country],
            disableDropdown: true,
            countryCodeEditable: false,
          })}
          inputProps={{
            id: htmlFor,
            autoComplete: 'tel',
            required,
            'data-slot': 'input-group-control',
            'aria-invalid': error || undefined,
            'aria-describedby': error && htmlFor ? `${htmlFor}-error` : undefined,
            'data-automated_test_id': 'automated-test-phone-input',
          }}
          containerClass="flex-1 min-w-0 !w-full"
          inputClass="!w-full !h-full !border-0 !bg-transparent !shadow-none !rounded-md !text-sm !text-foreground !pl-12 focus:!shadow-none"
          buttonClass={cn(
            '!rounded-l-md !border-0 !bg-transparent hover:!bg-transparent',
            lockCountry && '!cursor-default [&_.arrow]:!hidden',
          )}
          dropdownClass="!m-0 !mt-1 !rounded-md !border !border-border !bg-popover !text-popover-foreground !shadow-md"
          searchClass="!p-2"
          dropdownStyle={{ width: dropdownWidth }}
          searchStyle={{ width: '100%' }}
          onBlur={() => onBlur?.()}
        />
      </InputGroup>

      <FieldError id={htmlFor ? `${htmlFor}-error` : undefined}>{errorText}</FieldError>
    </Field>
  );
};

export default PhoneInputField;
