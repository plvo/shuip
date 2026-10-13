'use client';

import { createFormHook } from '@tanstack/react-form';
import { DatetimeField } from '@/components/ui/shuip/tanstack-form/datetime-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DatetimeField },
  formComponents: { SubmitButton },
});

export default function TsfDatetimeFieldExample() {
  const form = useAppForm({
    defaultValues: {
      scheduledAt: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      alert(`Scheduled at: ${value.scheduledAt?.toISOString() ?? 'unset'}`);
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
        name='scheduledAt'
        children={(field) => <field.DatetimeField label='Scheduled at' description='Pick a date and a time of day.' />}
      />

      <form.AppForm>
        <form.SubmitButton>Schedule</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
