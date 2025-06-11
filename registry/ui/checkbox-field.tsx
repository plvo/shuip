'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

const CheckboxField = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  boxLabel,
  ...props
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  boxLabel?: string;
} & React.ComponentProps<typeof Checkbox>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        if (!field) {
          console.error('Field is missing for CheckboxField', name);
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
};

export default CheckboxField;
