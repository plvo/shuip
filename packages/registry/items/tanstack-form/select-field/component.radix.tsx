'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext } from '@/components/ui/shuip/tanstack-form/form-context';

export type SelectFieldOption = Record<string, string>;

export interface SelectFieldProps {
  options: SelectFieldOption;
  label?: string;
  placeholder?: string;
  description?: string;
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<typeof Select>;
}

export function SelectField({ options, label, description, placeholder, fieldProps, props }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const { isValid, errors } = field.state.meta;
  const selectedLabel =
    Object.entries(options).find(([, value]) => value === field.state.value)?.[0] ?? (field.state.value || undefined);

  return (
    <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        name={field.name}
        value={field.state.value}
        // Spreading props into the generic Base UI Select makes it infer an unknown value, so narrow it here.
        onValueChange={(value) => field.handleChange(typeof value === 'string' ? value : '')}
        {...props}
      >
        <SelectTrigger aria-invalid={!isValid}>
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([optionLabel, value]) => (
            <SelectItem key={value} value={value}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
