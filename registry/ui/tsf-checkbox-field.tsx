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
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

export interface CheckboxFieldProps<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
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
  label: string;
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
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<typeof Checkbox>;
}

export function CheckboxField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({ form, name, label, description, formProps, fieldProps, props }: CheckboxFieldProps<TFormData, TName, TData>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors: Array<{ message: string }> = field.state.meta.errors.map((error) => ({ message: error ?? '' }));
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            <div className='flex items-center gap-2'>
              <Checkbox
                name={field.name}
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked as TData)}
                onBlur={field.handleBlur}
                aria-invalid={!isValid}
                {...props}
              />
              <FieldLabel htmlFor={field.name} className='text-sm cursor-pointer'>
                {label}
              </FieldLabel>
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
