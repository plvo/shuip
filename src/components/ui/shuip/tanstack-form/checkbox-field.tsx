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
  boxLabel?: string;
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
  props?: React.ComponentProps<typeof Checkbox>;
}

export function CheckboxField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({
  form,
  name,
  label,
  boxLabel,
  description,
  formProps,
  fieldProps,
  props,
}: CheckboxFieldProps<TFormData, TName, TData>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const errors = field.state.meta.errors;
        const isValid = field.state.meta.isValid && errors.length === 0;

        return (
          <Field data-invalid={!isValid} {...fieldProps}>
            <FieldLabel className='flex items-center justify-between'>{label}</FieldLabel>
            <div className='flex items-center gap-2'>
              <Checkbox
                name={field.name}
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked as TData)}
                onBlur={field.handleBlur}
                aria-invalid={!isValid}
                {...props}
              />
              {boxLabel && (
                <label htmlFor={field.name} className='text-sm cursor-pointer'>
                  {boxLabel}
                </label>
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {!isValid && <FieldError errors={errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}
