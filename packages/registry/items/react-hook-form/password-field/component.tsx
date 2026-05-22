'use client';

import type { Lens } from '@hookform/lenses';
import { Eye, EyeOff, InfoIcon } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PasswordFieldProps extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function PasswordField({ lens, label, description, tooltip, ...props }: PasswordFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const [showPassword, setShowPassword] = React.useState(false);
  const id = props.id ?? field.name;

  const handleTogglePassword = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          {...field}
          placeholder='Enter password'
          {...props}
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={field.value ?? ''}
          aria-invalid={fieldState.invalid}
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
      {fieldState.invalid && <FieldError className='text-xs text-left opacity-80' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
