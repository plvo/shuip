'use client';

import type { Lens } from '@hookform/lenses';
import type { SelectProps } from '@radix-ui/react-select';
import { useController } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SelectFieldOption = Record<string, string>;

export interface SelectFieldProps extends Omit<SelectProps, 'value' | 'defaultValue' | 'onValueChange'> {
  lens: Lens<string>;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
}

export function SelectField({ lens, options, label, description, placeholder, ...props }: SelectFieldProps) {
  const { field, fieldState } = useController(lens.interop());

  return (
    <Field className='gap-2' data-invalid={fieldState.invalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Select name={field.name} value={field.value ?? ''} onValueChange={field.onChange} {...props}>
        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className='w-full'>
          <SelectValue placeholder={placeholder} />
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
