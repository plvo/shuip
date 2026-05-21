'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { RadioField },
  formComponents: { SubmitButton },
});

export default function TsfRadioFieldExample() {
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <form.AppField
        name='plan'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
        }}
        children={(field) => (
          <field.RadioField
            options={[
              { label: 'Free', value: 'free' },
              { label: 'Pro', value: 'pro' },
              { label: 'Enterprise', value: 'enterprise' },
            ]}
            label='Subscription Plan'
            description='Choose your subscription plan'
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
}
