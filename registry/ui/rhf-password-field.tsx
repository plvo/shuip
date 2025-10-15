'use client';

import { Eye, EyeOff, InfoIcon } from 'lucide-react';
import * as React from 'react';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PasswordFieldProps<T extends FieldValues> extends React.ComponentProps<typeof InputGroupInput> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function PasswordField<T extends FieldValues>({
  register,
  label,
  description,
  tooltip,
  ...props
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => {
        return (
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
        );
      }}
    />
  );
}
