'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '#/registry/ui/tsf-input-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfInputFieldExample() {
  const form = useForm({
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
      <InputField
        form={form}
        name='name'
        label='Name'
        description='Your full name'
        formProps={{
          validators: {
            onChange: (value) => (value < 3 ? 'Name must be at least 3 characters' : undefined),
          },
        }}
      />

      <InputField
        form={form}
        name='email'
        label='Email'
        inputProps={{ type: 'email' }}
        formProps={{
          validators: {
            onChange: ({ value }) => (!value.includes('@') ? 'Invalid email address' : undefined),
          },
        }}
      />

      <SubmitButton form={form} type='submit' />
    </form>
  );
}
