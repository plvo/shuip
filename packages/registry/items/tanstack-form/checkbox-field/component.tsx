'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

export interface CheckboxFieldProps {
  label: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<typeof Checkbox>;
}

export function CheckboxField({ label, description, fieldProps, props }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const { isValid, errors } = field.state.meta;

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      <div className='flex items-center gap-2'>
        <Checkbox
          id={field.name}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          onBlur={field.handleBlur}
          aria-invalid={!isValid}
          {...props}
        />
        <FieldLabel htmlFor={field.name} className='text-sm cursor-pointer'>
          {label}
        </FieldLabel>
      </div>
      {!isValid && <FieldError className='text-xs text-left' errors={errors.map((error) => ({ message: error }))} />}
      {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
    </Field>
  );
}
