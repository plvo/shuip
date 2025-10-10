'use client';

import { TanstackForm, useAppForm } from '#/registry/hooks/tsf-context';

export default function TsfInputFieldComposedExample() {
  const form = useAppForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <TanstackForm form={form} className='space-y-4'>
      <form.AppField
        name='username'
        validators={{
          onChange: ({ value }) => (value.length < 3 ? 'Username must be at least 3 characters' : undefined),
        }}
      >
        {(field) => <field.InputField label='Username' description='Choose a unique username' />}
      </form.AppField>

      <form.AppField
        name='email'
        validators={{
          onChange: ({ value }) => (!value.includes('@') ? 'Invalid email address' : undefined),
        }}
      >
        {(field) => <field.InputField label='Email' inputProps={{ type: 'email' }} />}
      </form.AppField>

      <form.AppField
        name='password'
        validators={{
          onChange: ({ value }) => (value.length < 8 ? 'Password must be at least 8 characters' : undefined),
        }}
      >
        {(field) => <field.InputField label='Password' inputProps={{ type: 'password' }} />}
      </form.AppField>

      <form.SubmitButton>Create Account</form.SubmitButton>
    </TanstackForm>
  );
}
