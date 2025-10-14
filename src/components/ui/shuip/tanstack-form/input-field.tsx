import type {
  DeepKeys,
  DeepValue,
  FieldAsyncValidateOrFn,
  FieldOptions,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormApi,
} from '@tanstack/react-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface InputFieldProps<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName>,
> {
  form: ReactFormApi<
    TFormData,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    any
  >;
  name: TName;
  label?: string;
  description?: string;
  formProps?: Partial<
    FieldOptions<
      TFormData,
      TName,
      TData,
      undefined | FieldValidateOrFn<TFormData, TName, TData>,
      undefined | FieldValidateOrFn<TFormData, TName, TData>,
      undefined | FieldAsyncValidateOrFn<TFormData, TName, TData>,
      undefined | FieldValidateOrFn<TFormData, TName, TData>,
      undefined | FieldAsyncValidateOrFn<TFormData, TName, TData>,
      undefined | FieldValidateOrFn<TFormData, TName, TData>,
      undefined | FieldAsyncValidateOrFn<TFormData, TName, TData>,
      undefined | FieldValidateOrFn<TFormData, TName, TData>,
      undefined | FieldAsyncValidateOrFn<TFormData, TName, TData>
    >
  >;
  fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
  props?: React.ComponentProps<'input'>;
}

export function InputField<TFormData, TName extends DeepKeys<TFormData>, TData extends DeepValue<TFormData, TName>>({
  form,
  name,
  label,
  description,
  formProps,
  fieldProps,
  props,
}: InputFieldProps<TFormData, TName, TData>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors: Array<{ message: string }> = field.state.meta.errors.map((error) => ({ message: error ?? '' }));
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <Input
              type='text'
              name={field.name}
              value={field.state.value as string}
              onChange={(e) => field.handleChange(e.target.value as TData)}
              onBlur={field.handleBlur}
              aria-invalid={!isValid}
              {...props}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
