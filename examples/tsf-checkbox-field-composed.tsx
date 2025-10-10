'use client';

import { TanstackForm, useAppForm } from '#/registry/hooks/tsf-context';

export default function TsfCheckboxFieldComposedExample() {
  const form = useAppForm({
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
    <TanstackForm form={form} className='space-y-4'>
      <form.AppField
        name='terms'
        validators={{
          onChange: ({ value }) => (!value ? 'You must accept the terms and conditions' : undefined),
        }}
      >
        {(field) => (
          <field.CheckboxField
            label='Terms and Conditions'
            boxLabel='I accept the terms and conditions'
            description='You must accept the terms to continue'
          />
        )}
      </form.AppField>

      <form.AppField name='marketing'>
        {(field) => (
          <field.CheckboxField
            label='Marketing'
            boxLabel='Send me promotional emails'
            description='Optional: Receive updates about new features'
          />
        )}
      </form.AppField>

      <form.SubmitButton>Submit</form.SubmitButton>
    </TanstackForm>
  );
}
