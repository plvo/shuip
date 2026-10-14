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

export default function TsfDatetimeFieldValidationExample() {
  const form = useAppForm({
    defaultValues: {
      startsAt: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      alert(`Starts at: ${value.startsAt?.toISOString() ?? 'unset'}`);
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
        name='startsAt'
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Required';
            if (value.getTime() <= Date.now()) return 'Must be in the future';
            return undefined;
          },
        }}
        children={(field) => (
          <field.DatetimeField label='Starts at' description='Must be a future date and time.' minDate={new Date()} />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Book</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
