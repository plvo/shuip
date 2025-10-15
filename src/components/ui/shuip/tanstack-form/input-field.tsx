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
import { InfoIcon } from 'lucide-react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  fieldProps?: React.ComponentProps<typeof Field>;
  props?: React.ComponentProps<'input'>;
  tooltip?: React.ReactNode;
}

export function InputField<TFormData, TName extends DeepKeys<TFormData>, TData extends DeepValue<TFormData, TName>>({
  form,
  name,
  label,
  description,
  formProps,
  fieldProps,
  props,
  tooltip,
}: InputFieldProps<TFormData, TName, TData>) {
  return (
    <form.Field name={name} {...formProps}>
      {(field) => {
        const { isValid, errors } = field.state.meta;

        return (
          <Field className='gap-2' data-invalid={!isValid} {...fieldProps}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <InputGroup>
              <InputGroupInput
                type='text'
                name={field.name}
                value={field.state.value as string}
                onChange={(e) => field.handleChange(e.target.value as TData)}
                onBlur={field.handleBlur}
                aria-invalid={!isValid}
                {...props}
              />
              {tooltip && (
                <InputGroupAddon align='inline-end'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton aria-label='Info' size='icon-xs'>
                        <InfoIcon />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              )}
            </InputGroup>
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
