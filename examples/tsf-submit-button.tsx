'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '@/components/ui/shuip/tanstack-form/input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfSubmitButtonExample() {
  const form = useForm({
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4 max-w-md'
    >
      <InputField
        form={form}
        name='email'
        label='Email'
        description='Subscribe to our newsletter'
        validators={{
          onChange: ({ value }) => (!value ? 'Email is required' : !value.includes('@') ? 'Invalid email' : undefined),
        }}
        inputProps={{ type: 'email', placeholder: 'Email' }}
      />

      <SubmitButton form={form}>Subscribe</SubmitButton>
    </form>
  );
}
