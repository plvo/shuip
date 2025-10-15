'use client';

import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';
import { PasswordField } from '@/components/ui/shuip/tanstack-form/password-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfPasswordFieldExample() {
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: ({ value }) => {
        return value.password !== value.confirmPassword ? 'Passwords do not match' : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
    onSubmitInvalid({ formApi }) {
      toast.error(formApi.state.errors.join(', '));
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
            onChange: ({ value }) => (value.length < 8 ? 'Password must be at least 8 characters' : undefined),
          },
        }}
      />

      <SubmitButton form={form} />
    </form>
  );
}
