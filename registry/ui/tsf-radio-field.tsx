'use client';

import type { DeepKeys, DeepValue, FieldComponent, ReactFormApi } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldOption {
  label: string;
  value: string;
}

export interface RadioFieldProps<TFormData, TName extends DeepKeys<TFormData>> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  options: RadioFieldOption[];
  label?: string;
  description?: string;
  formProps?: FieldComponent<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
  radioProps?: React.ComponentProps<typeof RadioGroup>;
}

export function RadioField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({ form, name, options, label, description, formProps, fieldProps, radioProps }: RadioFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors = field.state.meta.errors;
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <RadioGroup
              name={field.name}
              value={field.state.value as string}
              onValueChange={(value) => field.handleChange(value as TData)}
              onBlur={field.handleBlur}
              aria-invalid={!isValid}
              {...radioProps}
            >
              {options.map(({ label, value }) => (
                <div key={value} className='flex items-center space-x-3 space-y-0'>
                  <RadioGroupItem value={value} id={`${field.name}-${value}`} />
                  <Label htmlFor={`${field.name}-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
            {description && <FieldDescription>{description}</FieldDescription>}
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
