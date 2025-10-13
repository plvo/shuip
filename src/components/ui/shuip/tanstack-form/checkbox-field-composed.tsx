'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '../hooks/tsf-context';

export interface CheckboxFieldProps extends Omit<React.ComponentProps<typeof Checkbox>, 'checked' | 'onCheckedChange'> {
  label: string;
  boxLabel?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function CheckboxField({ label, boxLabel, description, fieldProps, ...checkboxProps }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();

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
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked as boolean)}
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
}
