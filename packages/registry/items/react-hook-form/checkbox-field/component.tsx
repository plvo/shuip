'use client';

import type { Lens } from '@hookform/lenses';
import type * as React from 'react';
import { useController } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

export interface CheckboxFieldProps extends Omit<React.ComponentProps<typeof Checkbox>, 'checked' | 'onCheckedChange'> {
  lens: Lens<boolean>;
  label: string;
  description?: string;
}

export function CheckboxField({ lens, label, description, ...props }: CheckboxFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      <div className='flex items-center gap-2'>
        <Checkbox
          id={field.name}
          name={field.name}
          checked={field.value}
          onCheckedChange={(checked) => field.onChange(checked === true)}
          onBlur={field.onBlur}
          aria-invalid={fieldState.invalid}
          {...props}
        />
        <FieldLabel htmlFor={field.name} className='text-sm cursor-pointer'>
          {label}
        </FieldLabel>
      </div>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
