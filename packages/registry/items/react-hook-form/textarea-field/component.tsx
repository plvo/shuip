'use client';

import type { Lens } from '@hookform/lenses';
import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface TextareaFieldProps
  extends Omit<React.ComponentProps<typeof InputGroupTextarea>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function TextareaField({ lens, label, description, tooltip, ...props }: TextareaFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const id = props.id ?? field.name;

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupTextarea {...field} {...props} id={id} value={field.value ?? ''} aria-invalid={fieldState.invalid} />
        {tooltip && (
          <InputGroupAddon align='block-end' className='justify-end'>
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
