'use client';

import type { Lens } from '@hookform/lenses';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';

export interface TimeFieldProps
  extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange' | 'type'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
}

export function TimeField({ lens, label, description, ...props }: TimeFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          {...field}
          {...props}
          id={field.name}
          type='time'
          value={field.value ?? ''}
          aria-invalid={fieldState.invalid}
        />
      </InputGroup>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
