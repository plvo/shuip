'use client';

import { useForm } from '@tanstack/react-form';
import { InputField } from '#/registry/ui/tsf-input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

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
      <form.Field
        name='name'
        validators={{
          onChange: ({ value }) => (value.length < 3 ? 'Name must be at least 3 characters' : undefined),
        }}
      >
        {(field) => <InputField form={form} name='name' label='Name' description='Your full name' />}
      </form.Field>

      <form.Field
        name='email'
        validators={{
          onChange: ({ value }) => (!value.includes('@') ? 'Invalid email address' : undefined),
        }}
      >
        {(field) => <InputField form={form} name='email' label='Email' inputProps={{ type: 'email' }} />}
      </form.Field>

      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <SubmitButton type='submit' disabled={isSubmitting} loading={isSubmitting}>
            Submit
          </SubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
}
