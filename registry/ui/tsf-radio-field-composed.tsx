'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFieldContext } from '../hooks/tsf-context';

export interface RadioFieldProps extends Omit<React.ComponentProps<typeof RadioGroup>, 'value' | 'onValueChange'> {
  options: string[];
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function RadioField({ options, label, description, fieldProps, ...radioGroupProps }: RadioFieldProps) {
  const field = useFieldContext<string>();

  const hasErrors = field.state.meta.errors.length > 0;
  const errors = field.state.meta.errors.join(', ');

  return (
    <Field data-invalid={hasErrors} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <RadioGroup
        value={field.state.value}
        onValueChange={field.handleChange}
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
}
