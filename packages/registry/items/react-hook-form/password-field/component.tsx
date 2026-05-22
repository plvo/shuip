'use client';

import type { Lens } from '@hookform/lenses';
import { Eye, EyeOff, InfoIcon } from 'lucide-react';
import * as React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PasswordFieldProps extends Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> {
  lens: Lens<string>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function PasswordField({ lens, label, description, tooltip, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <FormField
      {...lens.interop()}
      render={({ field, fieldState }) => (
        <FormItem data-invalid={fieldState.invalid}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <InputGroup>
              <InputGroupInput
                {...field}
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter password'
                aria-invalid={fieldState.invalid}
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
          </FormControl>
          <FormMessage className='text-xs text-left opacity-80' />
          {description && <FormDescription className='text-xs'>{description}</FormDescription>}
        </FormItem>
      )}
    />
  );
}
