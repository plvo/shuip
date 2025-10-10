'use client';

import type { DeepKeys, ReactFormApi } from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldProps<TFormData, TName extends DeepKeys<TFormData>>
  extends Omit<React.ComponentProps<typeof RadioGroup>, 'value' | 'onValueChange'> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  options: string[];
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function RadioField<TFormData, TName extends DeepKeys<TFormData>>({
  form,
  name,
  options,
  label,
  description,
  fieldProps,
  ...radioGroupProps
}: RadioFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const hasErrors = field.state.meta.errors.length > 0;
        const errors = field.state.meta.errors.join(', ');

        return (
          <Field data-invalid={hasErrors} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <RadioGroup
              value={field.state.value as string}
              onValueChange={(value) => field.handleChange(value as any)}
              className='flex flex-col space-y-1'
              {...radioGroupProps}
            >
              {options.map((value) => (
                <div key={value} className='flex items-center space-x-3 space-y-0'>
                  <RadioGroupItem value={value} id={`${field.name}-${value}`} />
                  <label htmlFor={`${field.name}-${value}`} className='text-sm font-normal cursor-pointer'>
                    {value}
                  </label>
                </div>
              ))}
            </RadioGroup>
            {description && <FieldDescription>{description}</FieldDescription>}
            {hasErrors && <FieldError>{errors}</FieldError>}
          </Field>
        );
      }}
    </form.Field>
  );
}
