'use client';

import { useForm } from '@tanstack/react-form';
import { CheckboxField } from '#/registry/ui/tsf-checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfCheckboxFieldExample() {
  const form = useForm({
    defaultValues: {
      terms: false,
      marketing: false,
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
        name='terms'
        label='Terms and Conditions'
        boxLabel='I accept the terms and conditions'
        description='You must accept the terms to continue'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'You must accept the terms and conditions' : undefined),
          },
        }}
      />

      <CheckboxField
        form={form}
        name='marketing'
        label='Marketing'
        boxLabel='Send me promotional emails'
        description='Optional: Receive updates about new features'
      />

      <SubmitButton form={form} />
    </form>
  );
}
