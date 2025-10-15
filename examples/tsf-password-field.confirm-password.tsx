'use client';

import { useForm } from '@tanstack/react-form';
import { PasswordField } from '@/components/ui/shuip/tanstack-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfPasswordFieldExample() {
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
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
      <PasswordField
        form={form}
        name='password'
        label='Password'
        formProps={{
          validators: {
            onChange: ({ value }) => (value.length < 8 ? 'Password must be at least 8 characters' : undefined),
          },
        }}
      />

      <PasswordField
        form={form}
        name='confirmPassword'
        label='Confirm Password'
        formProps={{
          validators: {
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) => {
              const password = fieldApi.form.getFieldValue('password');
              if (value !== password) return 'Passwords do not match';
              return undefined;
            },
          },
        }}
      />

      <SubmitButton form={form} />
    </form>
  );
}
