'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TimeField } from '@/components/ui/shuip/tanstack-form/time-field';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeField },
  formComponents: { SubmitButton },
});

export default function TsfTimeFieldExample() {
  const form = useAppForm({
    defaultValues: {
      meetingTime: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
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
        name='meetingTime'
        validators={{
          onChange: ({ value }) => (!value ? 'Time is required' : undefined),
        }}
        children={(field) => <field.TimeField label='Meeting time' description='Pick a time' />}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
