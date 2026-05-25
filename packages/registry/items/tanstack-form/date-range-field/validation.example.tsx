'use client';

import { createFormHook } from '@tanstack/react-form';
import type { DateRange } from 'react-day-picker';
import { DateRangeField } from '@/components/ui/shuip/tanstack-form/date-range-field';
import { fieldContext, formContext } from '@/components/ui/shuip/tanstack-form/form-context';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateRangeField },
  formComponents: { SubmitButton },
});

interface Values {
  booking: DateRange | undefined;
}

export default function TsfDateRangeFieldValidationExample() {
  const form = useAppForm({
    defaultValues: { booking: undefined } as Values,
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
        name='booking'
        validators={{
          onChange: ({ value }) => {
            if (!value?.from) return 'Start date is required';
            if (!value.to) return 'End date is required';
            if (value.to < value.from) return 'End date must be on or after the start date';
            return undefined;
          },
        }}
        children={(field) => (
          <field.DateRangeField
            label='Booking window'
            description='Both dates are required and end date must be after start date'
            placeholder='Select start and end dates'
            minDate={new Date()}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton>Book</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
