import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { InputField } from '../ui/tsf-input-field-composed';
import { SubmitButton } from '../ui/tsf-submit-button';

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm, withFieldGroup, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    InputField,
  },
  formComponents: {
    SubmitButton,
  },
});

export interface TanstackFormProps<TFormData = any> extends React.ComponentProps<'form'> {
  form: ReturnType<typeof useAppForm<TFormData>>;
  children: React.ReactNode;
}

export const TanstackForm = <TFormData = any>({ form, children, ...formProps }: TanstackFormProps<TFormData>) => {
  return (
    <formContext.Provider value={form as any}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        {...formProps}
      >
        {children}
      </form>
    </formContext.Provider>
  );
};
