// 'use client';

// import type {
//   DeepKeys,
//   DeepValue,
//   FieldOptions,
//   FormAsyncValidateOrFn,
//   FormValidateOrFn,
//   ReactFormApi,
// } from '@tanstack/react-form';
// import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
// import { Input } from '@/components/ui/input';

// export interface InputFieldProps<
//   TFormData,
//   TOnMount extends FormValidateOrFn<TFormData> | undefined,
//   TOnChange extends FormValidateOrFn<TFormData> | undefined,
//   TOnChangeAsync extends FormAsyncValidateOrFn<TFormData> | undefined,
//   TOnBlur extends FormValidateOrFn<TFormData> | undefined,
//   TOnBlurAsync extends FormAsyncValidateOrFn<TFormData> | undefined,
//   TOnSubmit extends FormValidateOrFn<TFormData> | undefined,
//   TOnSubmitAsync extends FormAsyncValidateOrFn<TFormData> | undefined,
//   TOnDynamic extends FormValidateOrFn<TFormData> | undefined,
//   TOnDynamicAsync extends FormAsyncValidateOrFn<TFormData> | undefined,
//   TOnServer extends FormAsyncValidateOrFn<TFormData> | undefined,
//   TSubmitMeta,
//   TName extends DeepKeys<TFormData>,
//   TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
// > {
//   form: ReactFormApi<
//     TFormData,
//     TOnMount,
//     TOnChange,
//     TOnChangeAsync,
//     TOnBlur,
//     TOnBlurAsync,
//     TOnSubmit,
//     TOnSubmitAsync,
//     TOnDynamic,
//     TOnDynamicAsync,
//     TOnServer,
//     TSubmitMeta
//   >;
//   name: TName;
//   label?: string;
//   description?: string;
//   formProps?: Partial<
//     FieldOptions<
//       TFormData,
//       TName,
//       TData,
//       TOnMount | undefined,
//       TOnChange,
//       TOnChangeAsync,
//       TOnBlur,
//       TOnBlurAsync,
//       TOnSubmit,
//       TOnSubmitAsync,
//       TOnDynamic,
//       TOnDynamicAsync,
//     >
//   >;
//   fieldProps?: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' | 'responsive' };
//   inputProps?: React.ComponentProps<'input'>;
// }

// export function InputField<
//   TFormData,
//   TOnMount,
//   TOnChange,
//   TOnChangeAsync,
//   TOnBlur,
//   TOnBlurAsync,
//   TOnSubmit,
//   TOnSubmitAsync,
//   TOnDynamic,
//   TOnDynamicAsync,
//   TOnServer,
//   TSubmitMeta,
//   TName extends DeepKeys<TFormData>,
//   TData extends DeepValue<TFormData, TName> = DeepValue<TFormData, TName>,
// >({
//   form,
//   name,
//   label,
//   description,
//   formProps,
//   fieldProps,
//   inputProps,
// }: InputFieldProps<
//   TFormData,
//   TOnMount,
//   TOnChange,
//   TOnChangeAsync,
//   TOnBlur,
//   TOnBlurAsync,
//   TOnSubmit,
//   TOnSubmitAsync,
//   TOnDynamic,
//   TOnDynamicAsync,
//   TOnServer,
//   TSubmitMeta,
//   TName,
//   TData
// >) {
//   return (
//     <form.Field name={name} {...formProps}>
//       {(field) => {
//         const errors = field.state.meta.errors;
//         const isValid = field.state.meta.isValid && errors.length === 0;

//         return (
//           <Field data-invalid={!isValid} {...fieldProps}>
//             {label && <FieldLabel>{label}</FieldLabel>}
//             <Input
//               type='text'
//               name={field.name}
//               value={field.state.value as string}
//               onChange={(e) => field.handleChange(e.target.value as TData)}
//               onBlur={field.handleBlur}
//               aria-invalid={!isValid}
//               {...inputProps}
//             />
//             {description && <FieldDescription>{description}</FieldDescription>}
//             {!isValid && <FieldError errors={errors} />}
//           </Field>
//         );
//       }}
//     </form.Field>
//   );
// }
