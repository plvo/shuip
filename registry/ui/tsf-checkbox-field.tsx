'use client';

import type { DeepKeys, DeepValue, FieldOptions, ReactFormApi } from '@tanstack/react-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

export interface CheckboxFieldProps<TFormData, TName extends DeepKeys<TFormData>> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  label: string;
  boxLabel?: string;
  description?: string;
  formProps?: FieldOptions<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
  checkboxProps?: React.ComponentProps<typeof Checkbox>;
}

export function CheckboxField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({
  form,
  name,
  label,
  boxLabel,
  description,
  formProps,
  fieldProps,
  ...checkboxProps
}: CheckboxFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors = field.state.meta.errors;
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            <FieldLabel className='flex items-center justify-between'>{label}</FieldLabel>
            <div className='flex items-center gap-2'>
              <Checkbox
                name={field.name}
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked as TData)}
                onBlur={field.handleBlur}
                aria-invalid={!isValid}
                {...checkboxProps}
              />
              {boxLabel && (
                <label htmlFor={field.name} className='text-sm cursor-pointer'>
                  {boxLabel}
                </label>
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
