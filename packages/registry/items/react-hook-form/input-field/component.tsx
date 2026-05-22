'use client';

import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface InputFieldProps extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function InputField({ lens, label, description, tooltip, ...props }: InputFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          {...field}
          {...props}
          id={field.name}
          value={field.value ?? ''}
          aria-invalid={fieldState.invalid}
        />
        {tooltip && (
          <InputGroupAddon align='inline-end'>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton aria-label='Info' size='icon-xs'>
                  <InfoIcon />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        )}
      </InputGroup>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
