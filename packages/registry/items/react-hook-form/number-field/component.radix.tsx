'use client';

import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface NumberFieldProps
  extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange' | 'type'> {
  lens: Lens<number>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
  type?: 'number' | 'range';
}

export function NumberField({ lens, label, description, tooltip, type = 'number', ...props }: NumberFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const id = props.id ?? field.name;

  const value = field.value == null || Number.isNaN(field.value) ? '' : field.value;

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          {...field}
          {...props}
          id={id}
          type={type}
          value={value}
          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
