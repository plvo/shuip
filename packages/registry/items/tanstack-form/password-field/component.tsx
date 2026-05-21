'use client';

import { Eye, EyeOff, InfoIcon } from 'lucide-react';
import React from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PasswordFieldProps {
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<'input'>;
  tooltip?: React.ReactNode;
}

export function PasswordField({ label, description, fieldProps, props, tooltip }: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          id={field.name}
          type={showPassword ? 'text' : 'password'}
          placeholder='Enter password'
          name={field.name}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={!isValid}
          {...props}
        />
        <InputGroupAddon align='inline-end'>
          <InputGroupButton aria-label='Toggle password' onClick={handleTogglePassword}>
            {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
          </InputGroupButton>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton aria-label='Info' size='icon-xs'>
                  <InfoIcon />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </InputGroupAddon>
      </InputGroup>
      {!isValid && <FieldError className='text-xs text-left' errors={errors.map((error) => ({ message: error }))} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
