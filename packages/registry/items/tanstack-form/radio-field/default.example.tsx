'use client';

import { useForm } from '@tanstack/react-form';
import { RadioField } from '@/components/ui/shuip/tanstack-form/radio-field';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

export default function TsfRadioFieldExample() {
  const form = useForm({
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
      <RadioField
        form={form}
        name='plan'
        options={[
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
          { label: 'Enterprise', value: 'enterprise' },
        ]}
        label='Subscription Plan'
        description='Choose your subscription plan'
        formProps={{
          validators: {
            onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
          },
        }}
      />

      <SubmitButton form={form} />
    </form>
  );
}
