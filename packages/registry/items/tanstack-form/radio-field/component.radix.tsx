'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

export interface RadioFieldOption {
  label: string;
  value: string;
}

export interface RadioFieldProps {
  options: RadioFieldOption[];
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<typeof RadioGroup>;
}

export function RadioField({ options, label, description, fieldProps, props }: RadioFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        {...props}
      >
        {options.map((option) => (
          <div key={option.value} className='flex items-center space-x-3 space-y-0'>
            <RadioGroupItem id={`${field.name}-${option.value}`} value={option.value} aria-invalid={!isValid} />
            <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {!isValid && (
        <FieldError
          className='text-xs text-left'
          errors={errors.map((error) => ({ message: typeof error === 'string' ? error : error?.message }))}
        />
      )}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
