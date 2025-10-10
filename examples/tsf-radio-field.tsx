'use client';

import { useForm } from '@tanstack/react-form';
import { RadioField } from '#/registry/ui/tsf-radio-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

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
      <form.Field
        name='plan'
        validators={{
          onChange: ({ value }) => (!value ? 'Please select a plan' : undefined),
        }}
      >
        {(field) => (
          <RadioField
            form={form}
            name='plan'
            options={['Free', 'Pro', 'Enterprise']}
            label='Subscription Plan'
            description='Choose your subscription plan'
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
