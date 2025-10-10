'use client';

import { useForm } from '@tanstack/react-form';
import { CheckboxField } from '#/registry/ui/tsf-checkbox-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

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
      <form.Field
        name='terms'
        validators={{
          onChange: ({ value }) => (!value ? 'You must accept the terms and conditions' : undefined),
        }}
      >
        {(field) => (
          <CheckboxField
            form={form}
            name='terms'
            label='Terms and Conditions'
            boxLabel='I accept the terms and conditions'
            description='You must accept the terms to continue'
          />
        )}
      </form.Field>

      <form.Field name='marketing'>
        {(field) => (
          <CheckboxField
            form={form}
            name='marketing'
            label='Marketing'
            boxLabel='Send me promotional emails'
            description='Optional: Receive updates about new features'
          />
        )}
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
