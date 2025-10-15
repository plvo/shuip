'use client';

import { InfoIcon } from 'lucide-react';
import type * as React from 'react';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface InputFieldProps<T extends FieldValues> extends React.ComponentProps<typeof InputGroupInput> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label?: string;
  description?: string;
  tooltip?: React.ReactNode;
}

export function InputField<T extends FieldValues>({
  register,
  label,
  description,
  tooltip,
  ...props
}: InputFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => {
        return (
          <FormItem data-invalid={fieldState.invalid}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <InputGroup>
                <InputGroupInput {...field} type='text' aria-invalid={fieldState.invalid} {...props} />
                <InputGroupAddon align='inline-end'>
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
            <FormMessage className='text-xs text-left' />
            {description && <FormDescription className='text-xs'>{description}</FormDescription>}
          </FormItem>
        );
      }}
    />
  );
}
