import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '../hooks/tsf-context';

export interface InputFieldProps {
  label?: string;
  description?: string;
  inputProps?: React.ComponentProps<'input'>;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
}

export function InputField({ label, description, fieldProps, inputProps }: InputFieldProps) {
  const field = useFieldContext<string>();

  const hasErrors = field.state.meta.errors.length > 0;
  const errors = field.state.meta.errors.map((e) => e?.message).join(', ');

  return (
    <Field data-invalid={hasErrors} {...fieldProps}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input
        type='text'
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={hasErrors}
        {...inputProps}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors && <FieldError>{errors}</FieldError>}
    </Field>
  );
}
