'use client';

import { useForm } from '@tanstack/react-form';
import { CheckboxField } from '@/components/ui/shuip/tanstack-form/checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfCheckboxFieldExample() {
  const form = useForm({
    defaultValues: {
      termsExample: false,
      marketingExample: false,
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
      <CheckboxField
        form={form}
        name='termsExample'
        label='I accept the terms and conditions'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'You must accept the terms and conditions' : undefined),
          },
        }}
      />

      <CheckboxField
        form={form}
        name='marketingExample'
        label='Send me promotional emails'
        description='Optional: Receive updates about new features'
      />

      <SubmitButton form={form} />
    </form>
  );
}
