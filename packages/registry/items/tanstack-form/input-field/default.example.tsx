'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: { SubmitButton },
});

export default function TsfInputFieldExample() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
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
        name='name'
        validators={{
          onChange: ({ value }) => (value.length < 3 ? 'Name must be at least 3 characters' : undefined),
        }}
        children={(field) => <field.InputField label='Name' description='Your full name' />}
      />

      <form.AppField
        name='email'
        validators={{
          onChange: ({ value }) => (!value.includes('@') ? 'Invalid email address' : undefined),
        }}
        children={(field) => <field.InputField label='Email' props={{ type: 'email' }} />}
      />

      <form.AppForm>
        <form.SubmitButton props={{ variant: 'outline' }}>Register</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
