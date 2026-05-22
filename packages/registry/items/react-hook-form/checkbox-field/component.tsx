import type { Lens } from '@hookform/lenses';
import type * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export interface CheckboxFieldProps extends Omit<React.ComponentProps<typeof Checkbox>, 'checked' | 'onCheckedChange'> {
  lens: Lens<boolean>;
  label: string;
  description?: string;
}

export function CheckboxField({ lens, label, description, ...props }: CheckboxFieldProps) {
  return (
    <FormField
      {...lens.interop()}
      render={({ field, fieldState }) => (
        <FormItem data-invalid={fieldState.invalid}>
          <FormControl>
            <div className='flex items-center gap-2'>
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={fieldState.invalid}
                {...props}
              />
              <FormLabel htmlFor={field.name}>{label}</FormLabel>
            </div>
          </FormControl>
          <FormMessage className='text-xs text-left' />
          {description && <FormDescription className='text-xs'>{description}</FormDescription>}
        </FormItem>
      )}
    />
  );
}
