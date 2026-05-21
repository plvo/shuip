'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

// Simulate API call to check username availability
async function checkUsernameAvailability(username: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const takenUsernames = ['admin', 'user', 'test', 'demo'];
  return !takenUsernames.includes(username.toLowerCase());
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: { SubmitButton },
});

export default function TsfInputFieldAsyncValidationExample() {
  const form = useAppForm({
    defaultValues: {
      username: '',
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
        name='username'
        validators={{
          // Sync validation: runs immediately
          onChange: ({ value }) => {
            if (!value) return 'Username is required';
            if (value.length < 3) return 'Username must be at least 3 characters';
            if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
            return undefined;
          },
          // Async validation: checks availability via API
          onChangeAsync: async ({ value }) => {
            if (!value || value.length < 3) return undefined;

            const available = await checkUsernameAvailability(value);
            return available ? undefined : 'Username is already taken';
          },
          // Debounce async validation to avoid excessive API calls
          onChangeAsyncDebounceMs: 500,
        }}
        children={(field) => (
          <field.InputField
            label='Username'
            description='Username will be checked for availability'
            props={{ placeholder: 'Enter username' }}
          />
        )}
      />

      <form.AppField
        name='email'
        validators={{
          onBlur: ({ value }) => {
            if (!value) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
            return undefined;
          },
        }}
        children={(field) => (
          <field.InputField
            label='Email'
            description='Email will be validated on blur'
            props={{ type: 'email', placeholder: 'your@email.com' }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Create Account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
