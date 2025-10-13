import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { CheckboxField } from '@/components/ui/shuip/tanstack-form/checkbox-field-composed';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field-composed';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field-composed';
import { SelectField } from '@/components/ui/shuip/tanstack-form/select-field-composed';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

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
