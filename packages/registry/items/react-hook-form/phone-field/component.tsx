import type * as React from 'react';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export const phoneSchema = z.string().regex(E164_REGEX, 'Phone number must be in E.164 format (e.g. +33612345678)');

export interface PhoneFieldProps<T extends FieldValues> extends React.ComponentProps<typeof Input> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function PhoneField<T extends FieldValues>({
  register,
  label,
  description,
  placeholder = '+33612345678',
  ...props
}: PhoneFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field, fieldState }) => {
        return (
          <FormItem data-invalid={fieldState.invalid}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Input
                {...field}
                type='tel'
                inputMode='tel'
                autoComplete='tel'
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                {...props}
              />
            </FormControl>
            <FormMessage className='text-xs text-left' />
            {description && <FormDescription className='text-xs'>{description}</FormDescription>}
          </FormItem>
        );
      }}
    />
  );
}
