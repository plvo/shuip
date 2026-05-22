'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

export interface TimeFieldProps {
  label?: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'>;
}

export function TimeField({ label, description, fieldProps, props }: TimeFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          id={field.name}
          type='time'
          name={field.name}
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={!isValid}
          {...props}
        />
      </InputGroup>
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
