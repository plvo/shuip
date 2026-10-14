'use client';

import type { Lens } from '@hookform/lenses';
import type { ComponentProps } from 'react';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SelectFieldOption = Record<string, string>;

export interface SelectFieldProps
  extends Omit<ComponentProps<typeof Select>, 'value' | 'defaultValue' | 'onValueChange'> {
  lens: Lens<string>;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
}

export function SelectField({ lens, options, label, description, placeholder, ...props }: SelectFieldProps) {
  const { field, fieldState } = useController(lens.interop());
  const selectedLabel = Object.entries(options).find(([, value]) => value === field.value)?.[0];

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Select
        name={field.name}
        value={field.value ?? ''}
        // Spreading props into the generic Base UI Select makes it infer an unknown value, so narrow it here.
        onValueChange={(next) => field.onChange(typeof next === 'string' ? next : '')}
        {...props}
      >
        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([optionLabel, value]) => (
            <SelectItem key={optionLabel} value={value}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldState.invalid && <FieldError className='text-xs text-left' errors={[fieldState.error]} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
