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

export default function TsfSubmitButtonExample() {
  const form = useAppForm({
    defaultValues: {
      email: '',
    },

    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`Subscribed: ${value.email}`);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4 max-w-md'
    >
      <form.AppField
        name='email'
        validators={{
          onChange: ({ value }) => (!value ? 'Email is required' : !value.includes('@') ? 'Invalid email' : undefined),
        }}
        children={(field) => (
          <field.InputField
            label='Email'
            description='Subscribe to our newsletter'
            props={{ type: 'email', placeholder: 'Email' }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Subscribe</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
