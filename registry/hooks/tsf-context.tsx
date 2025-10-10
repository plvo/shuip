import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { CheckboxField } from '../ui/tsf-checkbox-field-composed';
import { InputField } from '../ui/tsf-input-field-composed';
import { RadioField } from '../ui/tsf-radio-field-composed';
import { SelectField } from '../ui/tsf-select-field-composed';
import { SubmitButton } from '../ui/tsf-submit-button';

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm, withFieldGroup, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    InputField,
    RadioField,
    SelectField,
    CheckboxField,
  },
  formComponents: {
    SubmitButton,
  },
});

export interface TanstackFormProps extends React.ComponentProps<'form'> {
  form: any;
  children: React.ReactNode;
}

export const TanstackForm = ({ form, children, ...formProps }: TanstackFormProps) => {
  return (
    <formContext.Provider value={form}>
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
