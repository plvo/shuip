'use client';

import { TanstackForm, useAppForm } from '#/registry/hooks/tsf-context';

export default function TsfSubmitButtonExample() {
  const form = useAppForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`Subscribed: ${value.email}`);
    },
  });

  return (
    <TanstackForm form={form} className='space-y-4 max-w-md'>
      <form.AppField
        name='email'
        validators={{
          onChange: ({ value }) => (!value ? 'Email is required' : !value.includes('@') ? 'Invalid email' : undefined),
        }}
      >
        {(field) => (
          <field.InputField
            label='Email'
            description='Subscribe to our newsletter'
            inputProps={{ type: 'email', placeholder: 'Email' }}
          />
        )}
      </form.AppField>

      <form.SubmitButton>Subscribe</form.SubmitButton>
    </TanstackForm>
  );
}
