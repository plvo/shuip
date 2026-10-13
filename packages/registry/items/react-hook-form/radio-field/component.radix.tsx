'use client';

import type { Lens } from '@hookform/lenses';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldProps
  extends Omit<React.ComponentProps<typeof RadioGroup>, 'value' | 'defaultValue' | 'onValueChange'> {
  lens: Lens<string>;
  options: string[];
  label?: string;
  description?: string;
}

export function RadioField({ lens, options, label, description, ...props }: RadioFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <RadioGroup
        name={field.name}
        value={field.value ?? ''}
        onValueChange={field.onChange}
        onBlur={field.onBlur}
        className='flex flex-col space-y-1'
        aria-invalid={fieldState.invalid}
        {...props}
      >
        {options.map((value) => (
          <div key={value} className='flex items-center space-x-3 space-y-0'>
            <RadioGroupItem id={`${field.name}-${value}`} value={value} aria-invalid={fieldState.invalid} />
            <Label htmlFor={`${field.name}-${value}`} className='font-normal'>
              {value}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
