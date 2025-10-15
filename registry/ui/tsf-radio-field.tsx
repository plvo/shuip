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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioFieldOption {
  label: string;
  value: string;
}

export interface RadioFieldProps<
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
  options: RadioFieldOption[];
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
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<typeof RadioGroup>;
}

export function RadioField<
  TFormData,
  TName extends DeepKeys<TFormData>,
  TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
>({ form, name, options, label, description, formProps, fieldProps, props }: RadioFieldProps<TFormData, TName, TData>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const { isValid, errors } = field.state.meta;

        return (
          <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <RadioGroup
              name={field.name}
              value={field.state.value as string}
              onValueChange={(value) => field.handleChange(value as TData)}
              onBlur={field.handleBlur}
              {...props}
            >
              {options.map(({ label, value }) => (
                <div key={value} className='flex items-center space-x-3 space-y-0'>
                  <RadioGroupItem id={`${field.name}-${value}`} value={value} aria-invalid={!isValid} />
                  <Label htmlFor={`${field.name}-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
            {!isValid && (
              <FieldError className='text-xs text-left' errors={errors.map((error) => ({ message: error }))} />
            )}
            {description && <FieldDescription className='text-xs'>{description}</FieldDescription>}
          </Field>
        );
      }}
    </form.Field>
  );
}
