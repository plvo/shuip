'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TimeRangeField } from '@/components/ui/shuip/tanstack-form/time-range';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeRangeField },
  formComponents: { SubmitButton },
});

export default function TsfTimeRangeExample() {
  const form = useAppForm({
    defaultValues: {
      slot: { start: '', end: '' },
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
        name='slot'
        validators={{
          onChange: ({ value }) =>
            value.start && value.end && value.start < value.end
              ? undefined
              : 'Select a start and end time (end after start)',
        }}
        children={(field) => <field.TimeRangeField label='Meeting slot' description='Pick a start and end time' />}
      />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
