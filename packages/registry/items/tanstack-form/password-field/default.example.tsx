'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { PasswordField } from '@/components/ui/shuip/tanstack-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { PasswordField },
  formComponents: { SubmitButton },
});

export default function TsfPasswordFieldExample() {
  const form = useAppForm({
    defaultValues: {
      password: '',
    },

    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='password'
        validators={{
          onChange: ({ value }) => (value.length < 8 ? 'Password must be at least 8 characters' : undefined),
        }}
        children={(field) => <field.PasswordField label='Password' />}
      />

      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
}
