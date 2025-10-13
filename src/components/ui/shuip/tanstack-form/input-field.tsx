'use client';

import type { DeepKeys, DeepValue, ReactFormApi } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface InputFieldProps<
  TFormData,
  TName extends DeepKeys<TFormData>,
  // TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  label?: string;
  description?: string;
  inputProps?: React.ComponentProps<'input'>;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function InputField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({ form, name, label, description, fieldProps, inputProps }: InputFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const hasErrors = field.state.meta.errors.length > 0;
        const errors = field.state.meta.errors.map((e) => e?.message).join(', ');

        return (
          <Field data-invalid={hasErrors} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <Input
              type='text'
              id={field.name}
              name={field.name}
              value={field.state.value as string}
              onChange={(e) => field.handleChange(e.target.value as TData)}
              onBlur={field.handleBlur}
              aria-invalid={hasErrors}
              {...inputProps}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {hasErrors && <FieldError>{errors}</FieldError>}
          </Field>
        );
      }}
    </form.Field>
  );
}
