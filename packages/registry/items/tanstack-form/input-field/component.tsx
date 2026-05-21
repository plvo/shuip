'use client';

import { InfoIcon } from 'lucide-react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface InputFieldProps {
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<'input'>;
  tooltip?: React.ReactNode;
}

export function InputField({ label, description, fieldProps, props, tooltip }: InputFieldProps) {
  const field = useFieldContext<string | number>();
  const { isValid, errors } = field.state.meta;
  const isNumeric = props?.type === 'number' || props?.type === 'range' || typeof field.state.value === 'number';

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          id={field.name}
          type={isNumeric ? 'number' : 'text'}
          name={field.name}
          value={field.state.value}
          onChange={(e) => field.handleChange(isNumeric ? e.target.valueAsNumber : e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={!isValid}
          {...props}
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
      {!isValid && <FieldError className='text-xs text-left' errors={errors.map((error) => ({ message: error }))} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
