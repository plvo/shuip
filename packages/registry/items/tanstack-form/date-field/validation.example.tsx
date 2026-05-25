'use client';

import { createFormHook } from '@tanstack/react-form';
import { DateField } from '@/components/ui/shuip/tanstack-form/date-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const today = new Date();
today.setHours(0, 0, 0, 0);

const oneYearFromNow = new Date(today);
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateField },
  formComponents: { SubmitButton },
});

export default function TsfDateFieldValidationExample() {
  const form = useAppForm({
    defaultValues: {
      appointment: undefined as Date | undefined,
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Appointment: ${value.appointment?.toLocaleDateString() ?? 'none'}`);
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
        name='appointment'
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Pick an appointment date';
            if (value < today) return 'Appointment must be in the future';
            if (value > oneYearFromNow) return 'Appointment must be within a year';
            return undefined;
          },
        }}
        children={(field) => (
          <field.DateField
            label='Appointment'
            description='Within the next 12 months'
            minDate={today}
            maxDate={oneYearFromNow}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Book</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
