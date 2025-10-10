'use client';

import { TanstackForm, useAppForm } from '#/registry/hooks/tsf-context';

export default function TsfRadioFieldComposedExample() {
  const form = useAppForm({
    defaultValues: {
      plan: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <TanstackForm form={form} className='space-y-4'>
      <form.AppField
        name='plan'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
        }}
      >
        {(field) => (
          <field.RadioField
            options={['Free', 'Pro', 'Enterprise']}
            label='Subscription Plan'
            description='Choose your subscription plan'
          />
        )}
      </form.AppField>

      <form.SubmitButton>Submit</form.SubmitButton>
    </TanstackForm>
  );
}
