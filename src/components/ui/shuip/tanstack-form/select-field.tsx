'use client';

import type { SelectProps } from '@radix-ui/react-select';
import type { DeepKeys, ReactFormApi } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export interface SelectFieldProps<TFormData, TName extends DeepKeys<TFormData>>
  extends Omit<SelectProps, 'value' | 'onValueChange' | 'form'> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function SelectField<TFormData, TName extends DeepKeys<TFormData>>({
  form,
  name,
  options,
  label,
  description,
  placeholder,
  fieldProps,
  ...selectProps
}: SelectFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const hasErrors = field.state.meta.errors.length > 0;
        const errors = field.state.meta.errors.join(', ');

        return (
          <Field data-invalid={hasErrors} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <Select
              value={field.state.value as string}
              onValueChange={(value) => field.handleChange(value as any)}
              {...selectProps}
            >
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
      }}
    </form.Field>
  );
}
