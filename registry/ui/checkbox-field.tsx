'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { FieldPath, FieldValues, UseFormRegisterReturn } from 'react-hook-form';

export interface CheckboxFieldProps<T extends FieldValues> extends React.ComponentProps<typeof Checkbox> {
  register: UseFormRegisterReturn<FieldPath<T>>;
  label: string;
  boxLabel?: string;
  description?: string;
}

export function CheckboxField<T extends FieldValues>({
  register,
  label,
  boxLabel,
  description,
  ...props
}: CheckboxFieldProps<T>) {
  return (
    <FormField
      {...register}
      render={({ field }) => {
        if (!field) {
          console.error('Field is missing for CheckboxField', field);
          return <></>;
        }

        return (
          <FormItem className='space-y-1.5'>
            <FormLabel className='flex items-center justify-between'>
              {label}
              <FormMessage className='max-sm:hidden text-sm' />
            </FormLabel>
            <FormControl>
              <div className='flex items-center gap-2'>
                <Checkbox {...field} {...props} />
                {boxLabel && (
                  <label htmlFor={field.name} className='text-sm cursor-pointer'>
                    {boxLabel}
                  </label>
                )}
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage className='sm:hidden text-xs text-left' />
          </FormItem>
        );
      }}
    />
  );
}

export default CheckboxField;
