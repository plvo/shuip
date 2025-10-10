'use client';

import type { DeepKeys, ReactFormApi } from '@tanstack/react-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

export interface CheckboxFieldProps<TFormData, TName extends DeepKeys<TFormData>>
  extends Omit<React.ComponentProps<typeof Checkbox>, 'checked' | 'onCheckedChange' | 'form'> {
  form: ReactFormApi<TFormData, any, any, any, any, any, any, any, any, any, any, any>;
  name: TName;
  label: string;
  boxLabel?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function CheckboxField<TFormData, TName extends DeepKeys<TFormData>>({
  form,
  name,
  label,
  boxLabel,
  description,
  fieldProps,
  ...checkboxProps
}: CheckboxFieldProps<TFormData, TName>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const hasErrors = field.state.meta.errors.length > 0;
        const errors = field.state.meta.errors.join(', ');

        return (
          <Field data-invalid={hasErrors} {...fieldProps}>
            <FieldLabel className='flex items-center justify-between'>
              {label}
              {hasErrors && <FieldError className='max-sm:hidden text-sm'>{errors}</FieldError>}
            </FieldLabel>
            <div className='flex items-center gap-2'>
              <Checkbox
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked as any)}
                id={field.name}
                {...checkboxProps}
              />
              {boxLabel && (
                <label htmlFor={field.name} className='text-sm cursor-pointer'>
                  {boxLabel}
                </label>
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {hasErrors && <FieldError className='sm:hidden text-xs text-left'>{errors}</FieldError>}
          </Field>
        );
      }}
    </form.Field>
  );
}
