'use client';

import type { SelectProps } from '@radix-ui/react-select';
import type { DeepKeys, DeepValue, FieldComponent, ReactFormApi } from '@tanstack/react-form';
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
export type SelectFieldOption = Record<string, string>;

export interface SelectFieldProps<TFormData, TName extends DeepKeys<TFormData>>
  extends Omit<SelectProps, 'value' | 'onValueChange' | 'form'> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
  formProps?: FieldComponent<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
  selectProps?: React.ComponentProps<typeof Select>;
}

export function SelectField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({
  form,
  name,
  options,
  label,
  description,
  placeholder,
  formProps,
  fieldProps,
  selectProps,
}: SelectFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors = field.state.meta.errors;
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <Select
              name={field.name}
              value={field.state.value as string}
              onValueChange={(value) => field.handleChange(value as TData)}
              aria-invalid={!isValid}
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
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
