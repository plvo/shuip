'use client';

import type { SelectProps } from '@radix-ui/react-select';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '../hooks/tsf-context';

/**
 * Key is the label, value is the value
 * @example
 * const options: SelectFieldOption = {
 *   'First': '1',
 *   'Second': '2',
 *   'Third': '3',
 * };
 */
export type SelectFieldOption<T extends string = string> = Record<string, T>;

export interface SelectFieldProps extends SelectProps {
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function SelectField({
  options,
  label,
  description,
  placeholder,
  fieldProps,
  ...selectProps
}: SelectFieldProps) {
  const field = useFieldContext<string>();

  const hasErrors = field.state.meta.errors.length > 0;
  const errors = field.state.meta.errors.join(', ');

  return (
    <Field data-invalid={hasErrors} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select value={field.state.value} onValueChange={field.handleChange} {...selectProps}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([label, value]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasErrors && <FieldError>{errors}</FieldError>}
    </Field>
  );
}
