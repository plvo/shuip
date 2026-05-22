'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TimeField } from '@/components/ui/shuip/tanstack-form/time-field';

const BUSINESS_OPEN = '09:00';
const BUSINESS_CLOSE = '18:00';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TimeField },
  formComponents: { SubmitButton },
});

export default function TsfTimeFieldValidationExample() {
  const form = useAppForm({
    defaultValues: {
      appointment: '',
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
        name='appointment'
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Time is required';
            if (value < BUSINESS_OPEN || value > BUSINESS_CLOSE) {
              return `Appointment must be between ${BUSINESS_OPEN} and ${BUSINESS_CLOSE}`;
            }
            return undefined;
          },
        }}
        children={(field) => (
          <field.TimeField
            label='Appointment'
            description={`Office hours: ${BUSINESS_OPEN} – ${BUSINESS_CLOSE}`}
            props={{ min: BUSINESS_OPEN, max: BUSINESS_CLOSE }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Book</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
